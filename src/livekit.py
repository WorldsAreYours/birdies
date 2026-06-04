import logging
import asyncio
import re

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    inference,
)
from livekit.plugins import openai, deepgram, silero
from livekit.agents.llm import ChatContent, ChatMessage


logger = logging.getLogger("interrupt-user")
logger.setLevel(logging.INFO)

@function_tool
async def lookup_bird(
    context: RunContext,
    location: str,
):
    '''Used to lookup bird species'''

    return {'species': 'blue-jay'}
    

server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata[" vad"] = silero.VAD.load()


server.setup_fnc = prewarm



@server.rtc_session(agent_name="my-agent")
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=inference.STT("deepgram/nova3", language="multi"),
        llm=inference.LLM("openai/gpt-4.1-mini"),
        tts=inference.TTS("cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"),
    )

    agent = Agent(
        instructions="You are a wise bird-listener and watcher. You can receive a live bird sound and identify it. Keep messages as concise as possible.",
        tools=[lookup_bird],
    )

    await session.start(agent=agent, room=ctx.room)
    await session.generate_reply(instructions="Greet and let the user know you are ready to id birds from.")

if __name__ =="__main__":
    cli.run_app(server=server)