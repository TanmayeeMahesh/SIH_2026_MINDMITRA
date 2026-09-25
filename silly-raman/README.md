# 🧠 MindMitra — SafeNav & "My Journey Garden"
### AI Cognitive Gaming & Safe Navigation Assistant for Dementia Patients
**Smart India Hackathon 2026 | Problem Statement ID: 26003**  
*Theme: MedTech | Category: Software | Team: MindMitra*

---

## 🌟 Executive Summary
**MindMitra SafeNav** transforms traditional navigation into a personalized safety and cognitive engagement system designed specifically for elderly individuals with Mild Cognitive Impairment (MCI) and dementia. 

Caregivers define a trusted network of safe locations (Home, Temple, Mart, Hospital, Park). The system computes the safest, simplest route with minimal turns, guides the patient through high-contrast directional indicators and reassuring regional voice prompts, continuously monitors for geodesic route deviations using a multi-stage temporal hysteresis filter, and reinforces safe navigation through **"My Journey Garden"**—a positive, non-punitive gamified visual ecosystem.

---

## 🏗️ 3-Layer System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               CAREGIVER PORTAL               │
                    │  • Define Safe Places (Home, Temple, Mart)   │
                    │  • Real-Time Map Telemetry & Geofence Logs   │
                    └──────────────────────┬───────────────────────┘
                                           │ WebSockets / REST
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              PATIENT NAVIGATION SYSTEM                                    │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 1: SAFETY & GEODESIC TRACKING ENGINE                                          │  │
│  │  • Great-Circle Haversine Distance & Forward Bearing Calculation                    │  │
│  │  • Geodesic Cross-Track Corridor Error (d_xt <= 25m)                                │  │
│  │  • Multi-Stage Temporal Hysteresis Filter (Eliminates GPS jitter & false alarms)   │  │
│  │  • Caregiver SOS & Emergency Geofence Escalation                                   │  │
│  └───────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                      │ State Events                                       │
│                                      ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 2: COGNITIVE ASSISTANCE & VOICE ENGINE (Elder-First Interface)               │  │
│  │  • Single-Instruction Step-by-Step UI (Giant Turn Arrows, WCAG AAA High Contrast)   │  │
│  │  • Culturally Adaptive Voice Guidance (Assamese, Hindi, Bengali, English)           │  │
│  │  • Reassuring, Non-Disorienting Auto-Reorientation Prompts                         │  │
│  └───────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                      │ Micro-Accomplishments                              │
│                                      ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ LAYER 3: GAMIFICATION — "MY JOURNEY GARDEN" (🌱 Positive Reinforcement)            │  │
│  │  • Progressive 2D Isometric Garden Canvas (Barren -> Sprouts -> Blooms -> Flora)   │  │
│  │  • Non-Punitive Philosophy: Deviations pause growth with restorative prompts        │  │
│  │  • Daily walk streaks, milestone awards, and tactile visual sparkle animations      │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Mathematical Specification

### 1. Haversine Great-Circle Distance
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right) \quad (R = 6,371,000\text{ m})$$

### 2. Cross-Track Error ($d_{xt}$)
Determines perpendicular distance in meters from current GPS coordinate $P_{\text{curr}}$ to the safe route segment $P_{\text{start}} \to P_{\text{end}}$:
$$\delta_{13} = \frac{d(P_{\text{start}}, P_{\text{curr}})}{R}$$
$$d_{xt} = \arcsin\left(\sin(\delta_{13}) \cdot \sin(\theta_{\text{patient}} - \theta_{\text{segment}})\right) \cdot R$$

### 3. Multi-Stage Temporal Hysteresis Filter
- **$0 - 12\text{s}$ (Transient Buffer)**: GPS jitter and temporary stops are absorbed; no false alarm is triggered.
- **$15 - 35\text{s}$ (Gentle Reorient)**: Level 1 soft voice cue to patient: *"Let's turn back gently to keep our garden growing in the sunshine."* (Zero caregiver disturbance).
- **$> 35\text{s}$ or $> 75\text{m}$ (Critical Escalation)**: Level 2 critical alert pushed to Caregiver Dashboard with live coordinates and battery status.

---

## 🌱 "My Journey Garden" Point & Growth Matrix

| Action / Landmark | Points | Garden Visual State |
| :--- | :---: | :--- |
| **Start Walk** | `+10` | 🟫 Rich moist soil with sown seed |
| **Follow Segment** | `+2` / step | 🌱 Green sprouts emerge and catch sunlight |
| **Clear Checkpoint** | `+25` | 🌿 Patch of Holy Tulsi & Fern foliage unfolds |
| **Safe Destination Arrival** | `+100` | 🌼 Blooming Marigolds, Orchids & Sacred Banyan Tree |
| **3-Day Walk Streak** | `+50 bonus` | 🦋 Fluttering animated butterflies & singing birds |
| **Route Deviation** | `0 penalty` | 💧 Growth paused with restorative watering cue |

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Run Automated Verification Tests
```bash
pytest backend/tests/test_geodesic_and_garden.py -v
```

### 3. Launch MindMitra Platform
```bash
python run_app.py
```
*The app will automatically launch at `http://127.0.0.1:8000`.*

---

## 🎮 Interactive GPS Route Simulator (Hackathon Demo)
The application includes a built-in **Simulator Bar** at the top of the screen to demonstrate all real-world edge cases to judges without needing to walk outside:
1. **`🚶 Step Forward`**: Advances patient along the corridor, awards `+10 Pts`, and blossoms sprouts on the garden canvas.
2. **`↪️ Wrong Turn / Deviate`**: Moves patient off-corridor; triggers the 15s gentle reorientation voice prompt.
3. **`🔄 Re-enter Path`**: Returns patient to safe path; restores garden growth.
4. **`🏁 Arrive at Destination`**: Completes journey, awards `+100 Pts`, and unlocks the full blooming garden sanctuary.
5. **Caregiver Tab**: Switch to the **👨‍⚕️ Caregiver Portal** in real-time to observe the Leaflet map tracking the patient, geofence rings, and the deviation alert feed.

---

## 📊 MindMitra vs. Google Maps (SIH Defense)

| Feature | Standard Navigation (Google/Apple) | 🧠 MindMitra SafeNav & Garden |
| :--- | :--- | :--- |
| **Target Audience** | General commuters | **Elderly dementia & MCI patients** |
| **Cognitive Load** | High (50+ map POIs, 3D rotating angles) | **Minimal (1 giant arrow, large high-contrast text)** |
| **Voice Tone** | Robotic, fast, mechanical | **Gentle, culturally familiar Indian dialects (AI4Bharat)** |
| **Route Selection** | Shortest / fastest time | **Safest, simplest path with minimum turns** |
| **Deviation Handling** | Silent auto-rerouting through strange roads | **Gentle reorientation + Caregiver escalation** |
| **Motivation System**| None | **"My Journey Garden" Cognitive Stimulation Therapy** |

---

## 👥 Team MindMitra (SIH 2026)
*Empowering dementia care and cognitive independence across the North-Eastern Region and India.*
