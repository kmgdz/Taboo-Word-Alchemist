# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
from dataclasses import dataclass

@allow_storage
@dataclass
class Level:
    target_word: str
    taboo_words_joined: str # Using a comma-separated string to avoid complex types in simple storage

class TabooAlchemist(gl.Contract):
    levels: TreeMap[u256, Level]
    player_xp: TreeMap[Address, u256]
    current_level_count: u256

    def __init__(self):
        self.current_level_count = u256(0)
        
        # Add basic levels
        self._add_level("APPLE", "FRUIT,RED,TREE,NEWTON,IPHONE,STEVE JOBS")
        self._add_level("OCEAN", "WATER,SEA,BLUE,FISH,WAVES,BEACH")
        self._add_level("CLOCK", "TIME,TICK,WATCH,HOUR,MINUTE,HANDS")
        self._add_level("FIRE", "HOT,BURN,FLAME,HEAT,WOOD,SMOKE")

    def _add_level(self, target: str, taboos: str) -> None:
        level = Level(target_word=target, taboo_words_joined=taboos)
        self.levels[self.current_level_count] = level
        self.current_level_count += u256(1)

    @gl.public.write
    def add_level(self, target: str, taboos: str) -> None:
        # Anyone can contribute a new level in this open game
        self._add_level(target.upper(), taboos.upper())

    @gl.public.write
    def submit_hint(self, level_id: u256, hint: str) -> None:
        level = self.levels.get(level_id)
        if level is None:
            raise Exception("Level not found")

        hint_upper = hint.upper()
        
        # 1. Validation Logic
        if level.target_word in hint_upper:
            raise Exception("Violation! Hint contains the target word!")
            
        taboo_list = level.taboo_words_joined.split(",")
        for taboo in taboo_list:
            if taboo.strip() in hint_upper:
                raise Exception(f"Violation! Hint contains a taboo word: {taboo.strip()}")

        # 2. AI Consensus / Resolution via GenLayer LLM
        def ai_guess() -> str:
            task = f"""
You are playing a word guessing game. 
A player has provided a hint to describe a secret word.
You must guess the EXACT SINGLE WORD being described based on the hint.

Hint: "{hint}"

Rules:
- Output EXACTLY ONE WORD. 
- No punctuation, no explanation, no formatting.
"""
            result = gl.nondet.exec_prompt(task)
            return result.strip().upper()

        final_guess_raw = gl.eq_principle.strict_eq(ai_guess)
        
        # Remove any non-alphanumeric chars just in case the AI added punctuation
        final_guess = "".join(filter(str.isalnum, final_guess_raw))

        if final_guess == level.target_word:
            # Reward player on successful consensus
            sender = gl.message.sender_address
            current_xp = self.player_xp.get(sender)
            if current_xp is None:
                current_xp = u256(0)
            self.player_xp[sender] = current_xp + u256(100)
        else:
            raise Exception(f"AI guessed incorrectly: {final_guess}")

    @gl.public.view
    def get_level(self, level_id: u256) -> dict:
        level = self.levels.get(level_id)
        if level is None:
            return {}
        return {
            "target_word": level.target_word,
            "taboo_words_joined": level.taboo_words_joined
        }

    @gl.public.view
    def get_player_score(self, player: str) -> int:
        addr = Address(player)
        score = self.player_xp.get(addr)
        if score is None:
            return 0
        return int(score)
