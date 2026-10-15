import re
import unicodedata
from typing import Optional, Tuple

MONTHS = {
    "ENERO": 1,
    "FEBRERO": 2,
    "MARZO": 3,
    "ABRIL": 4,
    "MAYO": 5,
    "JUNIO": 6,
    "JULIO": 7,
    "AGOSTO": 8,
    "SEPTIEMBRE": 9,
    "OCTUBRE": 10,
    "NOVIEMBRE": 11,
    "DICIEMBRE": 12,
}

PATRONAL_CUIT = "30717955036"

MONTH_PATTERN = "|".join(MONTHS)
CUIL_LABEL_RE = re.compile(r"CUIL\W{0,15}?(\d{2})\s*-?\s*(\d{8})\s*-?\s*(\d)")
ANY_CUIL_RE = re.compile(r"(?<!\d)(\d{2})\s*-?\s*(\d{8})\s*-?\s*(\d)(?!\d)")
PAGO_RE = re.compile(r"PERIODO\s+DE\s+PAGO")
MONTH_NAME_RE = re.compile(rf"({MONTH_PATTERN})\W{{0,3}}(?:DE\W{{0,3}})?(\d{{4}})")
NUMERIC_PERIOD_RE = re.compile(r"(\d{1,2})\s*[/-]\s*(\d{4})")
MES_RE = re.compile(rf"MES\s+({MONTH_PATTERN})\W{{0,3}}(?:DE\W{{0,3}})?(\d{{4}})")


def _normalize(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    without_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return without_accents.upper()


def _format_cuil(groups: Tuple[str, str, str]) -> str:
    return f"{groups[0]}-{groups[1]}-{groups[2]}"


def _is_patronal(groups: Tuple[str, str, str]) -> bool:
    return "".join(groups) == PATRONAL_CUIT


def parse_cuil(text: str) -> Optional[str]:
    normalized = _normalize(text)

    for match in CUIL_LABEL_RE.finditer(normalized):
        if not _is_patronal(match.groups()):
            return _format_cuil(match.groups())

    for match in ANY_CUIL_RE.finditer(normalized):
        if _is_patronal(match.groups()):
            continue
        preceding = normalized[max(0, match.start() - 10):match.start()]
        if "CUIT" in preceding:
            continue
        return _format_cuil(match.groups())

    return None


def _to_period(month: int, year: str) -> str:
    return f"{year}-{month:02d}"


def _period_from_window(window: str) -> Optional[str]:
    month_name = MONTH_NAME_RE.search(window)
    if month_name:
        return _to_period(MONTHS[month_name.group(1)], month_name.group(2))

    numeric = NUMERIC_PERIOD_RE.search(window)
    if numeric and 1 <= int(numeric.group(1)) <= 12:
        return _to_period(int(numeric.group(1)), numeric.group(2))

    return None


def parse_pay_period(text: str) -> Optional[str]:
    normalized = _normalize(text)

    for pago in PAGO_RE.finditer(normalized):
        period = _period_from_window(normalized[pago.end():pago.end() + 80])
        if period:
            return period

    mes = MES_RE.search(normalized)
    if mes:
        return _to_period(MONTHS[mes.group(1)], mes.group(2))

    return None
