from typing import List, Dict, Any, Tuple

try:
    from backend.models import GardenState
except ImportError:
    from models import GardenState

class JourneyGardenEngine:
    """
    Manages the 'My Journey Garden' gamification engine for dementia patients.
    Designed with positive reinforcement psychology:
    - Never presents negative penalties or demoralizing score subtractions.
    - Encourages adherence through incremental growth of a living visual garden.
    - Employs culturally familiar elements (Tulsi, Marigold, Assam Orchid, Banyan Tree).
    """

    POINT_RULES = {
        "START_JOURNEY": 10,
        "STAY_ON_PATH": 2,
        "CORRECT_TURN": 15,
        "CHECKPOINT_REACHED": 25,
        "DESTINATION_SAFE": 100,
        "MEMORY_INDEPENDENCE": 20,
        "DAILY_STREAK_BONUS": 50
    }

    def __init__(self, initial_points: int = 40, streak_days: int = 3):
        self.points = initial_points
        self.streak_days = streak_days
        self.recent_event = "Journey started. A fresh seed has been sown in your garden!"

    def record_action(self, action_key: str, custom_bonus: int = 0) -> Tuple[int, str]:
        """
        Awards positive reinforcement points. Does NOT subtract points for mistakes.
        """
        pts = self.POINT_RULES.get(action_key, 0) + custom_bonus
        if pts > 0:
            self.points += pts
            
        if action_key == "START_JOURNEY":
            self.recent_event = "🌱 Seed sown! Walking forward nurtures your soil."
        elif action_key == "STAY_ON_PATH":
            self.recent_event = "☀️ Gentle sunlight is warming your sprouts."
        elif action_key == "CORRECT_TURN":
            self.recent_event = "🌿 New green leaves unfolded with your correct turn!"
        elif action_key == "CHECKPOINT_REACHED":
            self.recent_event = "🌼 A bright Marigold flower has blossomed at this landmark!"
        elif action_key == "DESTINATION_SAFE":
            self.recent_event = "🌳 Magnificent! Your garden is now a blooming sanctuary!"
        elif action_key == "DEVIATION_RESTORE":
            self.recent_event = "💧 Let's step back into the sunshine to water the seedlings."
            
        return self.points, self.recent_event

    def get_garden_stage(self) -> Tuple[int, str]:
        """
        Returns (level, stage_description).
        Level 1: 0 - 99 pts (Moist Soil & Little Sprouts)
        Level 2: 100 - 299 pts (Green Herbs & Leafy Foliage)
        Level 3: 300 - 599 pts (Blooming Marigolds & Orchids)
        Level 4: 600+ pts (Full Sanctuary with Birds & Butterflies)
        """
        if self.points < 100:
            return 1, "🌱 Moist Soil & Sprouting Seeds"
        elif self.points < 300:
            return 2, "🌿 Tulsi & Green Herb Patch"
        elif self.points < 600:
            return 3, "🌼 Blooming Marigolds & Assam Orchids"
        else:
            return 4, "🌳 Sacred Banyan Sanctuary with Birds & Butterflies"

    def generate_grid_matrix(self) -> List[List[str]]:
        """
        Generates a 3x3 visual tile matrix representing the garden's visual state.
        Tiles:
        'soil', 'seed', 'sprout', 'tulsi', 'marigold', 'orchid', 'tree', 'butterfly', 'pond'
        """
        lvl, _ = self.get_garden_stage()
        
        if lvl == 1:
            # Mostly rich soil with 1-2 center sprouts
            return [
                ["soil", "soil", "soil"],
                ["soil", "sprout", "soil"],
                ["seed", "soil", "soil"]
            ]
        elif lvl == 2:
            # Lush green herbs and small foliage
            return [
                ["sprout", "tulsi", "sprout"],
                ["soil", "fern", "soil"],
                ["tulsi", "sprout", "water_pot"]
            ]
        elif lvl == 3:
            # Vibrant flowers and cozy garden elements
            return [
                ["marigold", "tulsi", "marigold"],
                ["orchid", "garden_bench", "orchid"],
                ["marigold", "tulsi", "marigold"]
            ]
        else:
            # Grand blossoming garden sanctuary
            return [
                ["butterfly", "marigold", "butterfly"],
                ["orchid", "banyan_tree", "orchid"],
                ["bird", "lotus_pond", "sunflower"]
            ]

    def get_state(self) -> GardenState:
        lvl, stage_name = self.get_garden_stage()
        return GardenState(
            total_points=self.points,
            stage_name=stage_name,
            stage_level=lvl,
            grid=self.generate_grid_matrix(),
            recent_event=self.recent_event,
            streak_count=self.streak_days
        )
