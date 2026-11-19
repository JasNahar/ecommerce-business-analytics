import asyncio

from app.orchestrator import AgentRouter


def test_router_runs_specialists_and_requires_approval():
    result = asyncio.run(AgentRouter().run(
        "The ABB drive cabinet is hot and the motor stopped; bearing noise is present",
        "ABB drive cabinet",
    ))
    assert result["approved"] is False
    assert result["machine"]["name"]
    assert len(result["traces"]) == 8
    assert result["diagnosis"]["hypotheses"]
    assert result["parts"]
    assert result["safety"]["risk"] in {"High", "Standard"}
