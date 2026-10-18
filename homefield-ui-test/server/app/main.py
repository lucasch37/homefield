import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .geocode import CensusGeocoder, GeocodingError
from .layers import DEFAULT_SOURCES, RESULT_TYPES, RasterLayers
from .models import Hazards, Health, Report

logger = logging.getLogger(__name__)


def create_app(
    settings: Settings | None = None, *, geocoder=None, layers=None
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with httpx.AsyncClient(
            timeout=settings.geocoder_timeout_seconds, follow_redirects=False
        ) as client:
            app.state.geocoder = geocoder or CensusGeocoder(client, settings.data_dir / "king_county.geojson")
            app.state.layers = layers or RasterLayers(
                settings.data_dir, settings.ground_motion_enabled
            )
            yield

    app = FastAPI(
        title="Home Hazard Report API",
        version="1.0.0",
        lifespan=lifespan,
        description="King County observed hazard lookups from prepared pipeline files. "
        "Missing readings never imply a home is safe.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET"],
        allow_headers=["Accept", "Content-Type"],
    )

    @app.get("/health", response_model=Health)
    async def health(request: Request):
        states = await asyncio.to_thread(request.app.state.layers.health)
        ready = all(state.status in {"loaded", "disabled"} for state in states.values())
        return Health(status="ok" if ready else "degraded", layers=states)

    async def lookup(provider, layer, lat, lon):
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(provider.lookup, layer, lat, lon),
                timeout=settings.layer_timeout_seconds,
            )
        except Exception:
            # Never return exception text, local paths, or provider internals to the client.
            logger.exception("Hazard layer %s failed", layer)
            try:
                source = await asyncio.wait_for(
                    asyncio.to_thread(provider.source, layer), timeout=0.1
                )
            except Exception:
                source = DEFAULT_SOURCES[layer].model_copy(deep=True)
            return RESULT_TYPES[layer](
                status="error",
                source=source,
                message="This layer is unavailable right now. Please try again later.",
            )

    @app.get(
        "/hazards",
        response_model=Report,
        responses={
            404: {"description": "Address not found"},
            422: {"description": "Invalid query"},
            502: {"description": "Geocoder unavailable"},
            504: {"description": "Geocoder timed out"},
        },
    )
    async def hazards(
        request: Request,
        address: str | None = Query(default=None, max_length=500),
        lat: float | None = Query(default=None, ge=-90, le=90, allow_inf_nan=False),
        lon: float | None = Query(default=None, ge=-180, le=180, allow_inf_nan=False),
    ):
        if address is not None:
            address = address.strip()
            if not address:
                raise HTTPException(422, "Address cannot be blank.")
            if lat is not None or lon is not None:
                raise HTTPException(
                    422, "Provide an address or both lat and lon, not both."
                )
        elif lat is None or lon is None:
            raise HTTPException(422, "Provide an address or both lat and lon.")
        try:
            location = await asyncio.wait_for(
                request.app.state.geocoder.locate(address, lat, lon),
                timeout=settings.geocoder_timeout_seconds,
            )
        except GeocodingError as exc:
            raise HTTPException(exc.status_code, exc.message) from exc
        except TimeoutError as exc:
            raise HTTPException(
                504, "Address lookup timed out. Please try again."
            ) from exc
        report = dict(
            address=location.address,
            lat=location.lat,
            lon=location.lon,
            in_king_county=location.in_king_county,
        )
        if not location.in_king_county:
            return Report(
                **report,
                message="This report currently covers King County, Washington only."
            )
        values = await asyncio.gather(
            *(
                lookup(request.app.state.layers, name, location.lat, location.lon)
                for name in RESULT_TYPES
            )
        )
        return Report(**report, hazards=Hazards(**dict(zip(RESULT_TYPES, values))))

    return app


app = create_app()
