"""Offline contract tests for content prompt language selection."""

import re
from types import SimpleNamespace

import pytest

from services.prompts import (
    get_all_descriptions_stream_prompt,
    get_image_generation_prompt,
    get_language_instruction,
    get_outline_generation_prompt,
    get_page_description_prompt,
    get_ppt_language_instruction,
)


_CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]")



@pytest.fixture
def russian_context():
    return SimpleNamespace(
        creation_type="idea",
        idea_prompt="Создай презентацию о безопасном внедрении ИИ в университетах.",
        outline_text="",
        description_text="",
        reference_files_content=None,
        outline_requirements=None,
        description_requirements=None,
    )


def _assembled_prompts(context, language):
    return [
        get_outline_generation_prompt(context, language=language),
        get_page_description_prompt(
            context,
            outline=[{"title": "План внедрения", "points": ["Пилот снижает риск"]}],
            page_outline={"title": "Пилот снижает риск", "points": ["Проверить гипотезы"]},
            page_index=2,
            language=language,
            extra_fields=["配图与素材", "版式与重点", "演讲者备注"],
        ),
        get_all_descriptions_stream_prompt(
            context,
            outline=[],
            flat_pages=[{"title": "План внедрения", "points": ["Пилот снижает риск"]}],
            language=language,
            extra_fields=["配图与素材", "版式与重点"],
        ),
        get_image_generation_prompt(
            page_desc="Заголовок и краткие тезисы о пилотном проекте",
            outline_text="1. План внедрения",
            current_section="Пилот",
            has_material_images=True,
            extra_requirements="Используй ясную иерархию текста",
            language=language,
            page_index=2,
        ),
    ]


def test_content_prompts_are_cjk_free_for_supported_non_chinese_languages(russian_context):
    for language in ("ru", "en", "auto"):
        prompts = _assembled_prompts(russian_context, language)
        for prompt in prompts:
            assert not _CJK_RE.search(prompt), (language, prompt)


def test_russian_prompts_include_unambiguous_russian_instruction(russian_context):
    prompts = _assembled_prompts(russian_context, "ru")

    assert all("Отвечай полностью на русском языке." in prompt for prompt in prompts[:3])
    assert "Текст на слайдах должен быть полностью на русском языке." in prompts[3]


def test_auto_language_follows_input_without_unsolicited_chinese(russian_context):
    prompts = _assembled_prompts(russian_context, "auto")

    for prompt in prompts:
        assert "language of the user's requirements and input" in prompt
        assert "NEVER switch to Chinese unless the input itself is Chinese" in prompt


def test_english_extra_field_labels_normalize_to_canonical_storage_names():
    from services.ai_service import AIService

    text, fields = AIService._parse_extra_fields(
        "Visuals and materials: line chart\nLayout and emphasis: text left, image right",
        ["Visuals and materials", "Layout and emphasis"],
    )

    assert text == ""
    assert fields == {
        "配图与素材": "line chart",
        "版式与重点": "text left, image right",
    }


def test_language_helpers_are_non_empty_and_guarded():
    for language in ("ru", "en", "auto"):
        assert get_language_instruction(language)
        assert get_ppt_language_instruction(language)

    assert "NEVER output Chinese characters" in get_language_instruction("ru")
    assert "NEVER mix languages" in get_ppt_language_instruction("en")
