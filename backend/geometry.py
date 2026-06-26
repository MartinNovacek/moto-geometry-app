from __future__ import annotations

from dataclasses import asdict, dataclass
from math import atan2, cos, radians, sin
from typing import Dict, Tuple


@dataclass(frozen=True)
class BikePreset:
    name: str
    wheelbase: float
    rake: float
    published_trail: float
    triple_offset: float
    front_tire: str
    rear_tire: str
    curb_weight: float
    front_pressure: float
    rear_pressure: float
    baseline_rider_weight: float
    baseline_front_sag: float
    baseline_rear_sag: float
    baseline_fork_protrusion: float


GSXR1000_K8 = BikePreset(
    name="Suzuki GSX-R 1000 K7/K8",
    wheelbase=1415.0,
    rake=23.8,
    published_trail=98.0,
    triple_offset=28.0,
    front_tire="120/70 ZR17",
    rear_tire="190/50 ZR17",
    curb_weight=195.0,
    front_pressure=2.3,
    rear_pressure=2.5,
    baseline_rider_weight=86.0,
    baseline_front_sag=35.0,
    baseline_rear_sag=30.0,
    baseline_fork_protrusion=7.0,
)


def parse_tire(size: str) -> Dict[str, float]:
    left, rim_part = size.upper().replace("ZR", "R").split("R", 1)
    width_part, aspect_part = left.strip().split("/", 1)
    width = float(width_part)
    aspect = float(aspect_part.strip())
    rim = float(rim_part.strip())
    sidewall = width * (aspect / 100.0)
    diameter = rim * 25.4 + sidewall * 2.0
    return {
        "width": width,
        "aspect": aspect,
        "rim": rim,
        "diameter": diameter,
        "radius": diameter / 2.0,
    }


def trail_from_rake(radius: float, rake_deg: float, offset: float) -> float:
    rake = radians(rake_deg)
    return (radius * sin(rake) - offset) / cos(rake)


def loaded_radius_for_trail(trail: float, rake_deg: float, offset: float) -> float:
    rake = radians(rake_deg)
    return (trail * cos(rake) + offset) / sin(rake)


def tire_load_split(curb_weight: float, rider_weight: float) -> Tuple[float, float]:
    bike_front_bias = 0.52
    rider_front_bias = 0.47
    front_load = curb_weight * bike_front_bias + rider_weight * rider_front_bias
    rear_load = curb_weight * (1.0 - bike_front_bias) + rider_weight * (1.0 - rider_front_bias)
    return front_load, rear_load


def tire_deflection(
    baseline_deflection: float,
    load: float,
    baseline_load: float,
    pressure: float,
    baseline_pressure: float,
) -> float:
    safe_pressure = max(1.2, pressure)
    safe_baseline_pressure = max(1.2, baseline_pressure)
    load_factor = max(0.72, min(1.32, load / baseline_load))
    pressure_factor = max(0.72, min(1.32, safe_baseline_pressure / safe_pressure))
    return baseline_deflection * (load_factor ** 0.55) * (pressure_factor ** 0.45)


def loaded_tire_radius(
    tire: Dict[str, float],
    baseline_deflection: float,
    load: float,
    baseline_load: float,
    pressure: float,
    baseline_pressure: float,
) -> Tuple[float, float]:
    deflection = tire_deflection(baseline_deflection, load, baseline_load, pressure, baseline_pressure)
    return tire["radius"] - deflection, deflection


def clamp_float(data: Dict[str, object], key: str, default: float) -> float:
    try:
        return float(data.get(key, default))
    except (TypeError, ValueError):
        return default


def calculate_geometry(data: Dict[str, object]) -> Dict[str, object]:
    preset = GSXR1000_K8
    front_tire_name = str(data.get("frontTire", preset.front_tire))
    rear_tire_name = str(data.get("rearTire", preset.rear_tire))
    front_tire = parse_tire(front_tire_name)
    rear_tire = parse_tire(rear_tire_name)
    base_front = parse_tire(preset.front_tire)
    base_rear = parse_tire(preset.rear_tire)

    front_sag = clamp_float(data, "frontSag", 38.0)
    rear_sag = clamp_float(data, "rearSag", 33.0)
    fork_protrusion = clamp_float(data, "forkProtrusion", preset.baseline_fork_protrusion)
    rear_ride_height = clamp_float(data, "rearRideHeight", 0.0)
    triple_offset = clamp_float(data, "tripleOffset", preset.triple_offset)
    rider_weight = clamp_float(data, "riderWeight", 86.0)
    curb_weight = clamp_float(data, "curbWeight", preset.curb_weight)
    front_pressure = clamp_float(data, "frontPressure", preset.front_pressure)
    rear_pressure = clamp_float(data, "rearPressure", preset.rear_pressure)

    baseline_front_loaded_radius = loaded_radius_for_trail(
        preset.published_trail,
        preset.rake,
        preset.triple_offset,
    )
    baseline_front_deflection = base_front["radius"] - baseline_front_loaded_radius
    baseline_rear_deflection = baseline_front_deflection * 1.08

    front_load, rear_load = tire_load_split(curb_weight, rider_weight)
    baseline_front_load, baseline_rear_load = tire_load_split(preset.curb_weight, preset.baseline_rider_weight)
    front_loaded_radius, front_deflection = loaded_tire_radius(
        front_tire,
        baseline_front_deflection,
        front_load,
        baseline_front_load,
        front_pressure,
        preset.front_pressure,
    )
    rear_loaded_radius, rear_deflection = loaded_tire_radius(
        rear_tire,
        baseline_rear_deflection,
        rear_load,
        baseline_rear_load,
        rear_pressure,
        preset.rear_pressure,
    )
    base_rear_loaded_radius = base_rear["radius"] - baseline_rear_deflection

    front_height_delta = (
        front_loaded_radius
        - baseline_front_loaded_radius
        - (front_sag - preset.baseline_front_sag)
        - (fork_protrusion - preset.baseline_fork_protrusion)
    )
    rear_height_delta = (
        rear_loaded_radius
        - base_rear_loaded_radius
        - (rear_sag - preset.baseline_rear_sag)
        + rear_ride_height
    )
    pitch = atan2(front_height_delta - rear_height_delta, preset.wheelbase)
    pitch_deg = pitch * 180.0 / 3.141592653589793
    dynamic_rake = preset.rake + pitch_deg
    trail = trail_from_rake(front_loaded_radius, dynamic_rake, triple_offset)
    baseline_trail = preset.published_trail

    front_sag_target: Tuple[float, float] = (35.0, 42.0) if rider_weight > 100 else (30.0, 38.0)
    rear_sag_target: Tuple[float, float] = (30.0, 38.0) if rider_weight > 100 else (25.0, 35.0)

    diagram = build_diagram(
        wheelbase=preset.wheelbase,
        front_radius=front_loaded_radius,
        rear_radius=rear_loaded_radius,
        rake_deg=dynamic_rake,
        offset=triple_offset,
        trail=trail,
        front_height_delta=front_height_delta,
        rear_height_delta=rear_height_delta,
        fork_protrusion=fork_protrusion,
    )

    return {
        "preset": asdict(preset),
        "frontTire": front_tire,
        "rearTire": rear_tire,
        "frontLoadedRadius": front_loaded_radius,
        "rearLoadedRadius": rear_loaded_radius,
        "frontTireDeflection": front_deflection,
        "rearTireDeflection": rear_deflection,
        "frontLoad": front_load,
        "rearLoad": rear_load,
        "frontHeightDelta": front_height_delta,
        "rearHeightDelta": rear_height_delta,
        "pitchDeg": pitch_deg,
        "rakeDeg": dynamic_rake,
        "trail": trail,
        "baselineTrail": baseline_trail,
        "trailDelta": trail - baseline_trail,
        "frontSagTarget": front_sag_target,
        "rearSagTarget": rear_sag_target,
        "diagram": diagram,
    }


def build_diagram(
    wheelbase: float,
    front_radius: float,
    rear_radius: float,
    rake_deg: float,
    offset: float,
    trail: float,
    front_height_delta: float,
    rear_height_delta: float,
    fork_protrusion: float,
) -> Dict[str, object]:
    rear_x = 160.0
    front_x = 760.0
    ground_y = 470.0
    scale = (front_x - rear_x) / wheelbase
    rear_r = rear_radius * scale
    front_r = front_radius * scale
    rear_axle = {"x": rear_x, "y": ground_y - rear_r}
    front_axle = {"x": front_x, "y": ground_y - front_r}
    rear_chassis_lift = rear_height_delta * scale * 2.2
    front_chassis_lift = front_height_delta * scale * 2.2
    fork_slide = fork_protrusion * scale * 2.6
    swing_pivot = {"x": 390.0, "y": 285.0 - rear_chassis_lift}

    rake = radians(rake_deg)
    axis_dx = sin(rake)
    axis_dy = cos(rake)
    normal_x = cos(rake)
    normal_y = -sin(rake)
    offset_px = offset * scale
    trail_px = trail * scale

    visual_fork_length = 300.0 + max(0.0, fork_slide) * 0.8
    fork_top = {
        "x": front_axle["x"] - axis_dx * visual_fork_length,
        "y": front_axle["y"] - axis_dy * visual_fork_length,
    }
    fork_ground = {
        "x": fork_top["x"] + axis_dx * ((ground_y - fork_top["y"]) / axis_dy),
        "y": ground_y,
    }
    stem_top = {
        "x": fork_top["x"] - normal_x * offset_px,
        "y": fork_top["y"] - normal_y * offset_px,
    }
    steering_ground = {
        "x": stem_top["x"] + axis_dx * ((ground_y - stem_top["y"]) / axis_dy),
        "y": ground_y,
    }
    steering_axis = {
        "top": stem_top,
        "ground": steering_ground,
    }
    fork_at_axle_height = front_axle
    fork_bottom = front_axle
    fork_axis = {
        "top": fork_top,
        "bottom": fork_bottom,
        "ground": fork_ground,
        "axleHeight": fork_at_axle_height,
    }
    upper_distance_from_axle = max(182.0, 248.0 + front_chassis_lift - fork_slide)
    lower_distance_from_axle = max(122.0, upper_distance_from_axle - 76.0)
    upper_fork = {
        "x": front_axle["x"] - axis_dx * upper_distance_from_axle,
        "y": front_axle["y"] - axis_dy * upper_distance_from_axle,
    }
    lower_fork = {
        "x": front_axle["x"] - axis_dx * lower_distance_from_axle,
        "y": front_axle["y"] - axis_dy * lower_distance_from_axle,
    }
    upper_stem = {
        "x": upper_fork["x"] - normal_x * offset_px,
        "y": upper_fork["y"] - normal_y * offset_px,
    }
    lower_stem = {
        "x": lower_fork["x"] - normal_x * offset_px,
        "y": lower_fork["y"] - normal_y * offset_px,
    }
    upper_clamp = {
        "stem": upper_stem,
        "fork": upper_fork,
        "center": midpoint(upper_stem, upper_fork),
    }
    lower_clamp = {
        "stem": lower_stem,
        "fork": lower_fork,
        "center": midpoint(lower_stem, lower_fork),
    }
    frame = {
        "rearTop": {
            "x": rear_axle["x"] - 16.0,
            "y": rear_axle["y"] - 154.0 - rear_chassis_lift * 0.8,
        },
        "tail": {
            "x": rear_axle["x"] - 34.0,
            "y": rear_axle["y"] - 172.0 - rear_chassis_lift * 0.85,
        },
        "front": {
            "x": lower_stem["x"] - 22.0,
            "y": lower_stem["y"] + 44.0,
        },
        "tankTop": {
            "x": stem_top["x"] - 140.0,
            "y": stem_top["y"] - 24.0,
        },
        "tankRear": {
            "x": swing_pivot["x"] + 30.0,
            "y": swing_pivot["y"] - 98.0,
        },
    }

    return {
        "viewBox": "0 0 980 560",
        "scale": scale,
        "groundY": ground_y,
        "rearAxle": rear_axle,
        "frontAxle": front_axle,
        "rearRadius": rear_r,
        "frontRadius": front_r,
        "swingPivot": swing_pivot,
        "steeringAxis": steering_axis,
        "forkAxis": fork_axis,
        "upperClamp": upper_clamp,
        "lowerClamp": lower_clamp,
        "frame": frame,
        "frontHeightDelta": front_height_delta,
        "rearHeightDelta": rear_height_delta,
        "forkProtrusion": fork_protrusion,
        "offsetPx": offset_px,
        "offsetMm": offset,
        "trailPx": trail_px,
        "trailMm": trail,
        "wheelbasePx": (front_x - rear_x),
        "wheelbaseMm": wheelbase,
        "rakeDeg": rake_deg,
    }


def point_on_axis(top: Dict[str, float], dx: float, dy: float, distance: float) -> Dict[str, float]:
    return {"x": top["x"] + dx * distance, "y": top["y"] + dy * distance}


def midpoint(a: Dict[str, float], b: Dict[str, float]) -> Dict[str, float]:
    return {"x": (a["x"] + b["x"]) / 2.0, "y": (a["y"] + b["y"]) / 2.0}
