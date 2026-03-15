from fastapi import FastAPI

from app.routers import analyze, counter_clause, flags, outcome_sim, party_intel, simplify

app = FastAPI(title="ContractSense AI Service", version="1.0.0")

app.include_router(analyze.router, prefix="/ai", tags=["analyze"])
app.include_router(simplify.router, prefix="/ai", tags=["simplify"])
app.include_router(flags.router, prefix="/ai", tags=["flags"])
app.include_router(counter_clause.router, prefix="/ai", tags=["counter-clause"])
app.include_router(party_intel.router, prefix="/ai", tags=["party-intel"])
app.include_router(outcome_sim.router, prefix="/ai", tags=["outcome-sim"])


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
