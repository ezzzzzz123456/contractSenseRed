import logging

from fastapi import FastAPI

from app.routers import analyze, counter_clause, flags, intelligence, outcome_sim, party_intel, simplify

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(title="ContractSense AI Service", version="2.0.0")

app.include_router(analyze.router, prefix="/ai", tags=["analyze"])
app.include_router(simplify.router, prefix="/ai", tags=["simplify"])
app.include_router(flags.router, prefix="/ai", tags=["flags"])
app.include_router(counter_clause.router, prefix="/ai", tags=["counter-clause"])
app.include_router(party_intel.router, prefix="/ai", tags=["party-intel"])
app.include_router(outcome_sim.router, prefix="/ai", tags=["outcome-sim"])
app.include_router(intelligence.router, prefix="/ai", tags=["contract-intelligence"])


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
