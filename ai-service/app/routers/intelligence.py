from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ContractAnalysisReport,
    ContractAssistantQueryRequest,
    ContractAssistantQueryResponse,
    ContractIngestionRequest,
    DocumentUnderstandingResponse,
)
from app.services.contract_intelligence import contract_intelligence_service
from app.services.document_ingestion import document_ingestion_service

router = APIRouter()


@router.post("/intelligence/report", response_model=ContractAnalysisReport)
def generate_contract_report(payload: ContractIngestionRequest) -> ContractAnalysisReport:
    try:
        return contract_intelligence_service.analyze_contract(payload)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@router.post("/intelligence/structure", response_model=DocumentUnderstandingResponse)
def generate_document_structure(payload: ContractIngestionRequest) -> DocumentUnderstandingResponse:
    _, extraction, structured_document, evaluation = document_ingestion_service.extract_with_structure(payload)
    return DocumentUnderstandingResponse(
        extraction=extraction,
        structuredDocument=structured_document,
        evaluation=evaluation,
    )


@router.get("/intelligence/contracts/{contract_id}", response_model=ContractAnalysisReport)
def get_contract_report(contract_id: str) -> ContractAnalysisReport:
    report = contract_intelligence_service.get_report(contract_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Contract report not found.")
    return report


@router.post("/intelligence/assistant/query", response_model=ContractAssistantQueryResponse)
def query_contract_memory(payload: ContractAssistantQueryRequest) -> ContractAssistantQueryResponse:
    return contract_intelligence_service.assistant_query(payload)
