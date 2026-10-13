from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.agent.farming_mentor import AgentFarmingMentor

router = APIRouter(prefix="/agent", tags=["Agent AI Farming Mentor"])

# Singleton agent mentor instance
farming_mentor_agent = AgentFarmingMentor()

@router.post(
    "/chat",
    response_model=AgentChatResponse,
    summary="Chat with the autonomous Agent AI Farming Mentor",
    description="Conversational agent executing dynamic tool chains (GIS, Soil, Weather, Terrain, ML) to provide actionable farm advice with explainable reasoning traces."
)
async def chat_with_agent(
    request: AgentChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        response = await farming_mentor_agent.chat(request, current_user, db)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent reasoning error: {str(e)}"
        )
