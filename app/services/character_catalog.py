from __future__ import annotations

from pathlib import Path
from urllib.parse import quote


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".avif"}

DEFAULT_ELEMENT = "未标注"
DEFAULT_RARITY = 4

CHARACTER_METADATA: dict[str, dict[str, int | str]] = {
    "Albedo": {"element": "Geo", "rarity": 5},
    "阿贝多": {"element": "Geo", "rarity": 5},
    "Barbara": {"element": "Hydro", "rarity": 4},
    "芭芭拉": {"element": "Hydro", "rarity": 4},
    "Bennett": {"element": "Pyro", "rarity": 4},
    "班尼特": {"element": "Pyro", "rarity": 4},
    "Chongyun": {"element": "Cryo", "rarity": 4},
    "重云": {"element": "Cryo", "rarity": 4},
    "Diluc": {"element": "Pyro", "rarity": 5},
    "迪卢克": {"element": "Pyro", "rarity": 5},
    "Diona": {"element": "Cryo", "rarity": 4},
    "迪奥娜": {"element": "Cryo", "rarity": 4},
    "Eula": {"element": "Cryo", "rarity": 5},
    "优菈": {"element": "Cryo", "rarity": 5},
    "Fischl": {"element": "Electro", "rarity": 4},
    "菲谢尔": {"element": "Electro", "rarity": 4},
    "Ganyu": {"element": "Cryo", "rarity": 5},
    "甘雨": {"element": "Cryo", "rarity": 5},
    "Kaeya": {"element": "Cryo", "rarity": 4},
    "凯亚": {"element": "Cryo", "rarity": 4},
    "Klee": {"element": "Pyro", "rarity": 5},
    "可莉": {"element": "Pyro", "rarity": 5},
    "Lisa": {"element": "Electro", "rarity": 4},
    "丽莎": {"element": "Electro", "rarity": 4},
    "Mona": {"element": "Hydro", "rarity": 5},
    "莫娜": {"element": "Hydro", "rarity": 5},
    "Nahida": {"element": "Dendro", "rarity": 5},
    "纳西妲": {"element": "Dendro", "rarity": 5},
    "Qiqi": {"element": "Cryo", "rarity": 5},
    "七七": {"element": "Cryo", "rarity": 5},
    "Razor": {"element": "Electro", "rarity": 4},
    "雷泽": {"element": "Electro", "rarity": 4},
    "Sucrose": {"element": "Anemo", "rarity": 4},
    "砂糖": {"element": "Anemo", "rarity": 4},
    "Venti": {"element": "Anemo", "rarity": 5},
    "温迪": {"element": "Anemo", "rarity": 5},
    "Xiangling": {"element": "Pyro", "rarity": 4},
    "香菱": {"element": "Pyro", "rarity": 4},
    "Xingqiu": {"element": "Hydro", "rarity": 4},
    "行秋": {"element": "Hydro", "rarity": 4},
    "Xinyan": {"element": "Pyro", "rarity": 4},
    "辛焱": {"element": "Pyro", "rarity": 4},
    "Yoimiya": {"element": "Pyro", "rarity": 5},
    "宵宫": {"element": "Pyro", "rarity": 5},
    "Zhongli": {"element": "Geo", "rarity": 5},
    "钟离": {"element": "Geo", "rarity": 5},
    "Hu Tao": {"element": "Pyro", "rarity": 5},
    "胡桃": {"element": "Pyro", "rarity": 5},
    "Tartaglia": {"element": "Hydro", "rarity": 5},
    "达达利亚": {"element": "Hydro", "rarity": 5},
}


def metadata_for_name(name: str) -> tuple[str, int]:
    meta = CHARACTER_METADATA.get(name, {})
    return str(meta.get("element", DEFAULT_ELEMENT)), int(meta.get("rarity", DEFAULT_RARITY))


def build_character_records(source_dir: Path) -> list[dict[str, object]]:
    if not source_dir.exists():
        return []

    records: list[dict[str, object]] = []
    for path in sorted(source_dir.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        name = path.stem
        element, rarity = metadata_for_name(name)
        records.append(
            {
                "name": name,
                "avatar_url": f"/static/avatars/{quote(path.name)}",
                "element": element,
                "rarity": rarity,
            }
        )
    return records
