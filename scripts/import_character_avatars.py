from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from sqlalchemy import delete, select

import app.db.session as db_session
from app.db.session import init_engine, session_scope
from app.services.character_catalog import build_character_records
from app.models.battle import BattleMatch
from app.models.character import Character

def sync_avatars(
    source_dir: Path,
    dest_dir: Path,
    dry_run: bool = False,
    require_backend: str | None = None,
    replace: bool = False,
) -> None:
    if not source_dir.exists():
        raise FileNotFoundError(f"找不到图片目录: {source_dir}")

    dest_dir.mkdir(parents=True, exist_ok=True)
    records = build_character_records(source_dir)
    if not records:
        raise RuntimeError(f"图片目录为空，无法导入: {source_dir}")

    init_engine()
    db_session.init_schema()
    if require_backend and db_session.runtime_backend != require_backend:
        raise RuntimeError(
            f"当前连接到的是 {db_session.runtime_backend}，不是要求的 {require_backend}。"
        )
    print(f"当前数据库后端: {db_session.runtime_backend}")
    print(f"当前数据库地址: {db_session.runtime_database_url}")

    matched = 0
    copied = 0
    missing: list[str] = []

    with session_scope() as db:
        if replace:
            db.execute(delete(BattleMatch))
            db.execute(delete(Character))
            db.commit()
            for existing_file in dest_dir.iterdir():
                if existing_file.name == ".gitkeep":
                    continue
                if existing_file.is_dir():
                    shutil.rmtree(existing_file)
                else:
                    existing_file.unlink(missing_ok=True)

        existing_by_name = {
            item.name: item
            for item in db.execute(select(Character)).scalars().all()
        }

        for index, item in enumerate(records, start=1):
            name = str(item["name"])
            source_image = source_dir / name
            if not source_image.exists():
                matches = list(source_dir.glob(f"{name}.*"))
                source_image = matches[0] if matches else None
            if source_image is None or not source_image.exists():
                missing.append(name)
                continue

            matched += 1
            target_path = dest_dir / source_image.name
            avatar_url = f"/static/avatars/{source_image.name}"
            element = str(item.get("element", "未知"))
            rarity = int(item.get("rarity", 4))

            if dry_run:
                copied += 1
                continue

            shutil.copy2(source_image, target_path)
            character = existing_by_name.get(name)
            if character is None:
                character = Character(
                    id=index,
                    name=name,
                    avatar_url=avatar_url,
                    element=element,
                    rarity=rarity,
                    wins=0,
                    matches=0,
                    score=1000,
                    championships=0,
                )
                db.add(character)
                existing_by_name[name] = character
            else:
                character.avatar_url = avatar_url
                character.element = element
                character.rarity = rarity
            copied += 1

        if dry_run:
            db.rollback()

    print(f"匹配到角色: {matched}")
    print(f"处理图片: {copied}")
    if missing:
        print("未找到图片的角色:")
        for name in missing:
            print(f"  - {name}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="同步原神角色头像到数据库")
    parser.add_argument("--source", required=True, help="原始图片文件夹路径")
    parser.add_argument(
        "--dest",
        default=str(Path("app/static/avatars")),
        help="复制后的静态目录，默认 app/static/avatars",
    )
    parser.add_argument("--dry-run", action="store_true", help="只预览，不写入数据库和文件")
    parser.add_argument("--replace", action="store_true", help="先清空 characters 表再按图片文件夹重建")
    parser.add_argument(
        "--require-backend",
        choices=["mysql", "sqlite", "custom"],
        default=None,
        help="强制要求连接到指定数据库后端，避免误连到错误库",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    sync_avatars(
        Path(args.source),
        Path(args.dest),
        dry_run=args.dry_run,
        require_backend=args.require_backend,
        replace=args.replace,
    )


if __name__ == "__main__":
    main()
