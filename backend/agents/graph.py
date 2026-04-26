from langgraph.graph import StateGraph, END
from agents.state import InsightState
from agents.nodes import supervisor_node, researcher_node, analyst_node, visualizer_node
import logging

logger = logging.getLogger(__name__)

def build_graph():
    workflow = StateGraph(InsightState)

    # Add nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("visualizer", visualizer_node)

    # Fallback node if analyst fails too many times
    def fallback_node(state: InsightState) -> InsightState:
        logger.warning("Analyst failed maximum retries. Falling back to simple visualizer.")
        return {"code_output": "{}", "error": None}
        
    workflow.add_node("fallback", fallback_node)

    # Define edges
    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "researcher")
    workflow.add_edge("researcher", "analyst")

    # Conditional logic for the Analyst's self-correction loop
    def analyst_condition(state: InsightState) -> str:
        error = state.get("error")
        retries = state.get("retry_count", 0)
        
        if error and retries < 3:
            logger.info(f"Analyst condition: Retry {retries}/3 due to error: {error}")
            return "analyst"
        elif error:
            logger.info("Analyst condition: Max retries reached. Routing to fallback.")
            return "fallback"
        else:
            logger.info("Analyst condition: Success. Routing to visualizer.")
            return "visualizer"

    workflow.add_conditional_edges(
        "analyst",
        analyst_condition,
        {
            "analyst": "analyst",
            "fallback": "fallback",
            "visualizer": "visualizer"
        }
    )

    workflow.add_edge("fallback", "visualizer")
    workflow.add_edge("visualizer", END)

    return workflow.compile()
