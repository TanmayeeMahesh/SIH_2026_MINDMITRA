#!/usr/bin/env python3
"""
Train the MindMitra difficulty policy by Q-learning.

READ THIS IF YOU THINK YOU NEED TO "TRAIN A MODEL".
You don't. There is no neural network here, no dataset, no GPU, no PyTorch.
The "model" is a table of 324 states x 3 actions = 972 floating point numbers,
learned by a loop of arithmetic. It runs in well under a minute on a laptop CPU
using nothing but the Python standard library.

Why it works without real user data:
  A real user produces roughly 540 state transitions in three months. Tabular
  Q-learning needs orders of magnitude more, so per-user learning from scratch
  is impossible. Instead we build a SIMULATOR of a person with dementia --
  ability, fatigue, frustration, day-to-day variance and slow decline -- sample
  thousands of them, and let the agent explore against those. Exploration means
  deliberately choosing bad actions to find out what happens, which we may never
  do to a real person. So it happens here.

  The shipped table is then used GREEDILY on device (epsilon = 0).

Usage:  python sim/train_qtable.py
Output: src/engine/qtable.json   (imported directly by src/engine/policy.js)
"""

import json, math, os, random

random.seed(7)

# ---------------------------------------------------------------- constants
ACTIONS = ["down", "hold", "up"]
N_LEVELS = 5                # ladder positions per dimension
FLOW = (0.75, 0.90)         # target success band (docs/06 3.5)
EPISODES = 60_000
ITEMS_PER_SESSION = 6
ALPHA, GAMMA = 0.15, 0.85
EPS_START, EPS_END = 0.40, 0.02


# ---------------------------------------------------------------- learner sim
class SimulatedLearner:
    """A person with mild-to-moderate dementia, as a set of dials."""

    def __init__(self):
        self.ability = random.uniform(0.3, 3.6)       # true ability on the ladder
        self.fatigue_rate = random.uniform(0.02, 0.14)  # per item within a session
        self.frustration_thresh = random.randint(2, 4)  # consecutive misses tolerated
        self.noise = random.uniform(0.05, 0.20)         # day-to-day variance
        self.decline = random.uniform(0.0, 0.004)       # slow drift per session
        self.session = 0
        self.reset_session()

    def reset_session(self):
        self.fatigue = 0.0
        self.consecutive_misses = 0
        self.quit = False
        self.session += 1
        self.ability -= self.decline

    def attempt(self, level):
        """Probability of success falls as difficulty exceeds ability, and as fatigue rises."""
        effective = self.ability - self.fatigue + random.gauss(0, self.noise)
        p = 1.0 / (1.0 + math.exp(-(effective - level)))
        ok = random.random() < p
        self.fatigue += self.fatigue_rate
        self.consecutive_misses = 0 if ok else self.consecutive_misses + 1
        if self.consecutive_misses >= self.frustration_thresh:
            self.quit = True          # she puts the phone down. This is the failure we are avoiding.
        return ok, p


# ---------------------------------------------------------------- state coding
def b_acc(a):   return 0 if a < 0.40 else 1 if a < 0.60 else 2 if a < 0.85 else 3
def b_lat(r):   return 0 if r < 0.8 else 1 if r <= 1.3 else 2
def b_cue(c):   return 0 if c < 0.3 else 1 if c < 1.2 else 2
def b_pos(i, n): f = i / n; return 0 if f < 0.34 else 1 if f < 0.67 else 2
def b_trend(d): return 0 if d > 0.05 else 2 if d < -0.05 else 1

def key(acc, lat, cue, pos, trend, lvl):
    """MUST stay byte-identical to stateKey() in src/engine/policy.js, or the
    shipped table is looked up with keys it was never trained on.

    `lvl` (the current ladder position) is in the state because without it the
    observation is ambiguous: "everything correct" means opposite things at the
    easiest and the hardest setting, and averaging those two produces a policy
    that is noise. 4x3x3x3x3x5 = 1,620 states."""
    return f"{acc}{lat}{cue}{pos}{trend}{lvl}"


# ---------------------------------------------------------------- reward
def reward(correct, p_success, quit_now, cue_used, level_changed):
    """
    Asymmetric on purpose. A slightly-too-easy session for a person with dementia
    costs far less than a humiliating one, which costs the whole intervention.

    But "far less" is not "nothing", and the first version of this function made
    it nothing: being too easy scored 0.0 while abandonment scored -6.0, so the
    optimal policy was simply "step down forever and never risk a miss". The
    trained table really did come out saying `down` in every high-accuracy
    state, which is why a user answering everything correctly never saw the
    difficulty rise. Boredom is a real failure mode too -- just a slower one --
    so it now carries a genuine, smaller cost.
    """
    r = 0.0
    if FLOW[0] <= p_success <= FLOW[1]:
        r += 1.0                      # in the flow band: the thing we actually want
    elif p_success > FLOW[1]:
        r -= 0.4                      # too easy -- mild, but no longer free
    else:
        r -= 0.5                      # too hard -- worse than too easy, by design
    r += 0.3 if correct else -0.6
    r -= 0.4 * cue_used
    r -= 6.0 if quit_now else 0.0     # abandonment still dominates everything
    r -= 0.05 * level_changed         # mild churn penalty
    return r


# ---------------------------------------------------------------- training
def train():
    Q = {}

    def row(k):
        if k not in Q:
            Q[k] = [0.0, 0.0, 0.0]
        return Q[k]

    for ep in range(EPISODES):
        eps = EPS_START + (EPS_END - EPS_START) * (ep / EPISODES)
        learner = SimulatedLearner()
        level = random.randint(0, 2)
        history = []

        for _ in range(random.randint(6, 20)):          # a run of sessions
            learner.reset_session()
            results, cues, lats = [], [], []

            def observe(i, lvl):
                """The discrete state as the device would compute it, from what
                has happened so far this session."""
                acc = sum(results) / len(results) if results else 0.7
                lat_ratio = (sum(lats) / len(lats)) if lats else 1.0
                cue_avg = (sum(cues) / len(cues)) if cues else 0.0
                trend = (history[-1] - history[0]) if len(history) >= 2 else 0.0
                return key(b_acc(acc), b_lat(lat_ratio), b_cue(cue_avg),
                           b_pos(min(i, ITEMS_PER_SESSION - 1), ITEMS_PER_SESSION),
                           b_trend(trend), lvl)

            for i in range(ITEMS_PER_SESSION):
                s = observe(i, level)
                q = row(s)
                a = random.randrange(3) if random.random() < eps else max(range(3), key=lambda j: q[j])

                new_level = level + (1 if a == 2 else -1 if a == 0 else 0)

                # THE L0 SAFETY RAIL, modelled here because it is what actually
                # runs on the device (engine/ladder.js applyBounds): two
                # consecutive misses step the difficulty down immediately,
                # whatever the policy asked for.
                #
                # Training without it taught the policy to be far more cautious
                # than it needs to be -- it behaved as though it alone stood
                # between the user and abandonment, so "never go up" looked
                # optimal. With the rail present the policy can propose an
                # increase knowing the rail catches the downside, which is the
                # whole point of having a deterministic layer underneath.
                if learner.consecutive_misses >= 2:
                    new_level = level - 1

                new_level = max(0, min(N_LEVELS - 1, new_level))
                changed = int(new_level != level)
                level = new_level

                ok, p = learner.attempt(level)
                cue = 0 if ok else min(4, learner.consecutive_misses)
                results.append(1 if ok else 0)
                cues.append(cue)
                lats.append(1.0 + (0.4 if not ok else -0.1) + random.gauss(0, 0.15))

                r = reward(ok, p, learner.quit, cue, changed)

                # Q-learning, crediting the action that ACTUALLY produced the
                # outcome. The previous version updated Q[prev_state][prev_action]
                # with this step's reward, so every action was scored by what the
                # NEXT one did -- credit assignment was off by one throughout,
                # which is the other half of why the learned policy was nonsense.
                terminal = learner.quit or i == ITEMS_PER_SESSION - 1
                target = r if terminal else r + GAMMA * max(row(observe(i + 1, level)))
                q[a] += ALPHA * (target - q[a])

                if learner.quit:
                    break

            history.append(sum(results) / max(1, len(results)))
            if learner.quit:
                break

    return Q


def evaluate(Q, policy):
    """Fraction of items landing in the flow band, and the abandonment rate."""
    in_band = total = quits = runs = 0
    for _ in range(3000):
        learner = SimulatedLearner()
        level = 1
        results, cues, lats, history = [], [], [], []
        runs += 1
        for i in range(ITEMS_PER_SESSION):
            acc = sum(results) / len(results) if results else 0.7
            s = key(b_acc(acc), b_lat(1.0), b_cue(sum(cues) / len(cues) if cues else 0),
                    b_pos(i, ITEMS_PER_SESSION), b_trend(0), level)
            a = policy(Q, s, acc)
            proposed = level + (1 if a == 2 else -1 if a == 0 else 0)
            if learner.consecutive_misses >= 2:      # the L0 rail, as on device
                proposed = level - 1
            level = max(0, min(N_LEVELS - 1, proposed))
            ok, p = learner.attempt(level)
            results.append(1 if ok else 0)
            cues.append(0 if ok else 1)
            total += 1
            if FLOW[0] <= p <= FLOW[1]:
                in_band += 1
            if learner.quit:
                quits += 1
                break
    return in_band / total, quits / runs


def greedy(Q, s, acc):
    q = Q.get(s)
    return max(range(3), key=lambda j: q[j]) if q else 1

def rule(_Q, _s, acc):
    if acc < FLOW[0]: return 0
    if acc > FLOW[1]: return 2
    return 1


if __name__ == "__main__":
    print(f"Training {EPISODES:,} episodes against simulated learners...")
    Q = train()
    q_band, q_quit = evaluate(Q, greedy)
    r_band, r_quit = evaluate(Q, rule)

    print(f"  Q-learning : {q_band:.1%} of items in the flow band, {q_quit:.1%} sessions abandoned")
    print(f"  rule       : {r_band:.1%} of items in the flow band, {r_quit:.1%} sessions abandoned")
    print(f"  states learned: {len(Q)}")

    out = {
        "meta": {
            "trained": True,
            "episodes": EPISODES,
            "states": len(Q),
            "actions": ACTIONS,
            "flowBand": list(FLOW),
            "evaluation": {
                "qlearning": {"inFlowBand": round(q_band, 4), "abandonRate": round(q_quit, 4)},
                "ruleBaseline": {"inFlowBand": round(r_band, 4), "abandonRate": round(r_quit, 4)},
            },
            "note": "Trained against simulated learners only. Deployed greedily (epsilon=0). "
                    "A real user never meets an exploring policy.",
        },
        "q": {k: [round(x, 4) for x in v] for k, v in sorted(Q.items())},
    }

    dest = os.path.join(os.path.dirname(__file__), "..", "src", "engine", "qtable.json")
    with open(os.path.abspath(dest), "w") as f:
        json.dump(out, f, indent=1)
    print(f"Wrote {os.path.abspath(dest)}")
