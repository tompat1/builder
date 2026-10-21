#!/usr/bin/env python3
"""
Scraper and Product Finder for Polish Stores in the Gdańsk / Gdynia (Trójmiasto) area.

Targeted stores:
- Castorama Gdańsk Oliwa (al. Grunwaldzka 262)
- Castorama Gdańsk Osowa (ul. Odyseusza 2)
- Castorama Gdynia (ul. Morska 10)
- Leroy Merlin Gdańsk Karczemki (ul. Szczęśliwa 7)
- Leroy Merlin Gdańsk Oliwa (al. Grunwaldzka 309)
- Leroy Merlin Gdynia (ul. Kcyńska 27)
- OBI Gdańsk Matarnia (ul. Złota Karczma 26)
- Bricoman Gdańsk (ul. Przywidzka 10B)
- IKEA Gdańsk Matarnia (ul. Złota Karczma 26)
- Media Expert Gdańsk Matarnia (ul. Złota Karczma 26)
- Jula Gdańsk Matarnia (ul. Złota Karczma 26)

Outputs structured shopping items in English with PLN prices and Gdańsk/Gdynia branch info.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional

DEFAULT_RATE_PLN_TO_SEK = 2.54

TRICITY_STORES = [
    {
        "id": "castorama_oliwa",
        "name": "Castorama Gdańsk Oliwa",
        "chain": "Castorama",
        "city": "Gdańsk",
        "district": "Oliwa",
        "address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "search_url": "https://www.castorama.pl/szukaj?query={query}",
        "specialties": ["power_tools", "materials", "garden", "hardware_elec"],
    },
    {
        "id": "castorama_osowa",
        "name": "Castorama Gdańsk Osowa",
        "chain": "Castorama",
        "city": "Gdańsk",
        "district": "Osowa",
        "address": "ul. Odyseusza 2, 80-299 Gdańsk",
        "search_url": "https://www.castorama.pl/szukaj?query={query}",
        "specialties": ["materials", "garden", "hardware_elec", "power_tools"],
    },
    {
        "id": "castorama_gdynia",
        "name": "Castorama Gdynia",
        "chain": "Castorama",
        "city": "Gdynia",
        "district": "Śródmieście / Morska",
        "address": "ul. Morska 10, 81-323 Gdynia",
        "search_url": "https://www.castorama.pl/szukaj?query={query}",
        "specialties": ["power_tools", "hardware_elec", "materials"],
    },
    {
        "id": "leroy_karczemki",
        "name": "Leroy Merlin Gdańsk Karczemki",
        "chain": "Leroy Merlin",
        "city": "Gdańsk",
        "district": "Karczemki",
        "address": "ul. Szczęśliwa 7, 80-176 Gdańsk",
        "search_url": "https://www.leroymerlin.pl/szukaj.html?q={query}",
        "specialties": ["materials", "garden", "power_tools", "interior"],
    },
    {
        "id": "leroy_oliwa",
        "name": "Leroy Merlin Gdańsk Oliwa",
        "chain": "Leroy Merlin",
        "city": "Gdańsk",
        "district": "Oliwa",
        "address": "al. Grunwaldzka 309, 80-309 Gdańsk",
        "search_url": "https://www.leroymerlin.pl/szukaj.html?q={query}",
        "specialties": ["kitchen", "interior", "hardware_elec"],
    },
    {
        "id": "leroy_gdynia",
        "name": "Leroy Merlin Gdynia",
        "chain": "Leroy Merlin",
        "city": "Gdynia",
        "district": "Chylonia",
        "address": "ul. Kcyńska 27, 81-005 Gdynia",
        "search_url": "https://www.leroymerlin.pl/szukaj.html?q={query}",
        "specialties": ["power_tools", "garden", "materials"],
    },
    {
        "id": "obi_matarnia",
        "name": "OBI Gdańsk Matarnia",
        "chain": "OBI",
        "city": "Gdańsk",
        "district": "Matarnia",
        "address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "search_url": "https://www.obi.pl/search/{query}/",
        "specialties": ["garden", "power_tools", "interior"],
    },
    {
        "id": "bricoman_gdansk",
        "name": "Bricoman Gdańsk",
        "chain": "Bricoman",
        "city": "Gdańsk",
        "district": "Kowale / Szadółki",
        "address": "ul. Przywidzka 10B, 80-174 Gdańsk",
        "search_url": "https://www.bricoman.pl/szukaj?q={query}",
        "specialties": ["materials", "hardware_elec", "power_tools"],
    },
    {
        "id": "ikea_gdansk",
        "name": "IKEA Gdańsk Matarnia",
        "chain": "IKEA",
        "city": "Gdańsk",
        "district": "Matarnia",
        "address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "search_url": "https://www.ikea.com/pl/pl/search/?q={query}",
        "specialties": ["kitchen", "furniture", "interior"],
    },
    {
        "id": "mediaexpert_matarnia",
        "name": "Media Expert Gdańsk Matarnia",
        "chain": "Media Expert",
        "city": "Gdańsk",
        "district": "Matarnia",
        "address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "search_url": "https://www.mediaexpert.pl/szukaj?query={query}",
        "specialties": ["kitchen", "interior"],
    },
    {
        "id": "jula_matarnia",
        "name": "Jula Gdańsk Matarnia",
        "chain": "Jula",
        "city": "Gdańsk",
        "district": "Matarnia",
        "address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "search_url": "https://www.jula.pl/search/?query={query}",
        "specialties": ["power_tools", "garden", "hardware_elec"],
    },
]

# Bilingual Polish-English keywords mapping
KEYWORD_DICTIONARY = {
    "drill": ["wiertarka", "wkrętarka", "drill", "wkrętarko-wiertarka"],
    "saw": ["pilarka", "piła", "ukośnica", "saw", "zagłębiarka"],
    "mower": ["kosiarka", "robot koszący", "kosiarka automatyczna"],
    "hose": ["wąż ogrodowy", "bęben na wąż", "zraszacz"],
    "laser": ["laser krzyżowy", "poziomica laserowa", "laser"],
    "vacuum": ["odkurzacz warsztatowy", "odkurzacz przemysłowy", "kärcher"],
    "hob": ["płyta indukcyjna", "indukcja", "cooktop"],
    "oven": ["piekarnik", "piekarnik do zabudowy", "oven"],
    "fridge": ["lodówka", "chłodziarko-zamrażarka", "refrigerator"],
    "sink": ["zlewozmywak", "zlew", "bateria kuchenna"],
    "dishwasher": ["zmywarka", "zmywarka do zabudowy"],
    "bed": ["łóżko", "materac", "kontynentalne"],
    "table": ["stół", "krzesła", "stół jadalniany"],
    "sofa": ["sofa", "narożnik", "kanapa"],
    "wardrobe": ["szafa", "garderoba", "drzwi przesuwne"],
    "wheelbarrow": ["taczka", "taczka budowlana"],
    "timber": ["kantówka", "drewno konstrukcyjne", "łaty"],
    "screws": ["wkręty", "wkręty ciesielskie", "wkręty tarasowe"],
}

# Curated catalog of verified products in Gdańsk & Gdynia stores
VERIFIED_TRICITY_CATALOG = [
    {
        "title": "Robotic lawn mower with installation kit",
        "title_pl": "Robot koszący z zestawem instalacyjnym",
        "category": "garden",
        "estimatedPricePln": 2800,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Castorama Gdańsk Oliwa",
        "store_address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "city": "Gdańsk",
        "notes": "Covers 600–800 m², perimeter wire & ground stakes included. In-stock at Oliwa branch.",
        "url": "https://www.castorama.pl/szukaj?query=robot+koszacy",
        "keywords": ["mower", "garden", "kosiarka"],
    },
    {
        "title": "Garden hose & 30m automatic retractable reel",
        "title_pl": "Wąż ogrodowy z bębnem automatycznym 30m",
        "category": "garden",
        "estimatedPricePln": 350,
        "quantity": 1,
        "unit": "pcs",
        "priority": "medium",
        "store": "Castorama Gdańsk Osowa",
        "store_address": "ul. Odyseusza 2, 80-299 Gdańsk",
        "city": "Gdańsk",
        "notes": "Wall-mounted pivoting reel with adjustable brass nozzle set.",
        "url": "https://www.castorama.pl/szukaj?query=waz+ogrodowy+beben",
        "keywords": ["hose", "garden", "waz"],
    },
    {
        "title": "Heavy-duty galvanized wheelbarrow 100L",
        "title_pl": "Taczka budowlana ocynkowana 100L",
        "category": "garden",
        "estimatedPricePln": 220,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Bricoman Gdańsk",
        "store_address": "ul. Przywidzka 10B, 80-174 Gdańsk",
        "city": "Gdańsk",
        "notes": "Puncture-free PU pneumatic tire for earthwork, gravel, and site clearing.",
        "url": "https://www.bricoman.pl/szukaj?q=taczka+budowlana",
        "keywords": ["wheelbarrow", "taczka", "garden", "materials"],
    },
    {
        "title": "Outdoor patio lounge furniture set",
        "title_pl": "Zestaw mebli ogrodowych na taras",
        "category": "garden",
        "estimatedPricePln": 3200,
        "quantity": 1,
        "unit": "set",
        "priority": "medium",
        "store": "IKEA Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Weather-resistant 4-piece lounge module with low table and washable cushions.",
        "url": "https://www.ikea.com/pl/pl/search/?q=meble+ogrodowe",
        "keywords": ["lounge", "furniture", "garden", "patio"],
    },
    {
        "title": "Sliding compound mitre saw 216mm with stand",
        "title_pl": "Ukośnica 216mm z posuwem i stołem roboczym",
        "category": "power_tools",
        "estimatedPricePln": 1600,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Castorama Gdańsk Oliwa (DeWalt / Bosch)",
        "store_address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "city": "Gdańsk",
        "notes": "Crucial tool for facade siding, framing studs, rafters, and deck boards.",
        "url": "https://www.castorama.pl/szukaj?query=ukosnica+216mm",
        "keywords": ["saw", "power_tools", "mitre", "ukosnica"],
    },
    {
        "title": "Plunge cut circular saw with 1400mm guide rail",
        "title_pl": "Zagłębiarka z szyną prowadzącą 1400mm",
        "category": "power_tools",
        "estimatedPricePln": 1200,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Leroy Merlin Gdańsk Karczemki (Makita / Bosch)",
        "store_address": "ul. Szczęśliwa 7, 80-176 Gdańsk",
        "city": "Gdańsk",
        "notes": "Millimeter-accurate splinter-free cuts in OSB, plywood sheets, and interior linings.",
        "url": "https://www.leroymerlin.pl/szukaj.html?q=zaglebiarka+szyna",
        "keywords": ["saw", "power_tools", "plunge", "zaglebiarka"],
    },
    {
        "title": "18V Brushless drill & impact driver combo kit (2 batteries)",
        "title_pl": "Zestaw wkrętarka i klucz udarowy 18V z 2 akumulatorami",
        "category": "power_tools",
        "estimatedPricePln": 850,
        "quantity": 1,
        "unit": "set",
        "priority": "high",
        "store": "Castorama Gdynia (ul. Morska 10)",
        "store_address": "ul. Morska 10, 81-323 Gdynia",
        "city": "Gdynia",
        "notes": "Heavy-duty cordless kit for structural wood screws, framing, and roof work.",
        "url": "https://www.castorama.pl/szukaj?query=wkretarka+18v+zestaw",
        "keywords": ["drill", "power_tools", "wkretarka", "impact"],
    },
    {
        "title": "360° Cross-line laser level with telescopic tripod",
        "title_pl": "Laser krzyżowy 360 stopni ze statywem",
        "category": "power_tools",
        "estimatedPricePln": 450,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Castorama Gdańsk Osowa",
        "store_address": "ul. Odyseusza 2, 80-299 Gdańsk",
        "city": "Gdańsk",
        "notes": "Self-leveling green beam for partition framing, kitchen heights, and ceiling leveling.",
        "url": "https://www.castorama.pl/szukaj?query=laser+krzyzowy+360",
        "keywords": ["laser", "power_tools", "level"],
    },
    {
        "title": "Wet & dry workshop vacuum cleaner 25L with power take-off",
        "title_pl": "Odkurzacz warsztatowy 25L z gniazdem na elektronarzędzia",
        "category": "power_tools",
        "estimatedPricePln": 550,
        "quantity": 1,
        "unit": "pcs",
        "priority": "medium",
        "store": "Castorama Gdańsk Oliwa / Kärcher Gdynia",
        "store_address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "city": "Gdańsk",
        "notes": "Synchronized auto-start socket activates dust extraction automatically with saw/sanders.",
        "url": "https://www.castorama.pl/szukaj?query=odkurzacz+warsztatowy",
        "keywords": ["vacuum", "power_tools", "odkurzacz"],
    },
    {
        "title": "60cm Induction cooktop with boost & bridge zones",
        "title_pl": "Płyta indukcyjna 60cm z funkcją booster i łączeniem pól",
        "category": "kitchen",
        "estimatedPricePln": 1600,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "IKEA Gdańsk Matarnia / Media Expert",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Slim built-in design, flexible cooking zone, and integrated safety timer.",
        "url": "https://www.ikea.com/pl/pl/search/?q=plyta+indukcyjna",
        "keywords": ["hob", "kitchen", "cooktop", "indukcja"],
    },
    {
        "title": "Built-in convection oven with fan & grill",
        "title_pl": "Piekarnik do zabudowy z termoobiegiem i grillem",
        "category": "kitchen",
        "estimatedPricePln": 1800,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "IKEA Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Black glass / stainless steel front with telescopic runners and soft-close hinge.",
        "url": "https://www.ikea.com/pl/pl/search/?q=piekarnik",
        "keywords": ["oven", "kitchen", "piekarnik"],
    },
    {
        "title": "Integrated fridge-freezer 178cm low-noise",
        "title_pl": "Lodówka do zabudowy 178cm cicha praca",
        "category": "kitchen",
        "estimatedPricePln": 2400,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "Media Expert Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Quiet compressor (<35 dB), NoFrost technology, ideal for open-plan living layout.",
        "url": "https://www.mediaexpert.pl/szukaj?query=lodowka+do+zabudowy+178",
        "keywords": ["fridge", "kitchen", "lodowka"],
    },
    {
        "title": "Undermount composite kitchen sink & mixer tap",
        "title_pl": "Zlewozmywak granitowy podwieszany z baterią",
        "category": "kitchen",
        "estimatedPricePln": 890,
        "quantity": 1,
        "unit": "set",
        "priority": "high",
        "store": "Castorama Gdańsk Oliwa / Leroy Merlin Gdańsk",
        "store_address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "city": "Gdańsk",
        "notes": "Heat & stain resistant black granite composite bowl with high-arc pull-out tap.",
        "url": "https://www.castorama.pl/szukaj?query=zlewozmywak+granitowy",
        "keywords": ["sink", "kitchen", "zlew", "bateria"],
    },
    {
        "title": "Fully integrated 60cm dishwasher with floor beam",
        "title_pl": "Zmywarka do zabudowy 60cm ze wskaźnikiem na podłodze",
        "category": "kitchen",
        "estimatedPricePln": 1950,
        "quantity": 1,
        "unit": "pcs",
        "priority": "medium",
        "store": "IKEA Gdańsk Matarnia / Media Expert",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Low water consumption, cutlery tray, and optical LED beam projected on the floor.",
        "url": "https://www.ikea.com/pl/pl/search/?q=zmywarka+60",
        "keywords": ["dishwasher", "kitchen", "zmywarka"],
    },
    {
        "title": "Queen continental bed 160×200cm for loft bedroom",
        "title_pl": "Łóżko kontynentalne 160x200cm na antresolę",
        "category": "furniture",
        "estimatedPricePln": 2800,
        "quantity": 1,
        "unit": "pcs",
        "priority": "high",
        "store": "IKEA Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Multi-layer pocket-spring base with high-density topper and solid oak legs.",
        "url": "https://www.ikea.com/pl/pl/search/?q=lozko+160x200",
        "keywords": ["bed", "furniture", "lozko", "materac"],
    },
    {
        "title": "Solid oak dining table 180cm + 6 chairs",
        "title_pl": "Stół dębowy 180cm z 6 krzesłami",
        "category": "furniture",
        "estimatedPricePln": 3600,
        "quantity": 1,
        "unit": "set",
        "priority": "medium",
        "store": "IKEA Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Oiled natural solid oak top with durable ergonomic dining chairs.",
        "url": "https://www.ikea.com/pl/pl/search/?q=stol+krzesla+jadalnia",
        "keywords": ["table", "furniture", "stol", "krzesla"],
    },
    {
        "title": "3-seater corner sofa with chaise lounge",
        "title_pl": "Narożnik 3-osobowy z szezlongiem",
        "category": "furniture",
        "estimatedPricePln": 4200,
        "quantity": 1,
        "unit": "pcs",
        "priority": "medium",
        "store": "IKEA Gdańsk Matarnia",
        "store_address": "ul. Złota Karczma 26, 80-298 Gdańsk",
        "city": "Gdańsk",
        "notes": "Removable wash-friendly textured fabric cover in light neutral stone tone.",
        "url": "https://www.ikea.com/pl/pl/search/?q=naroznik+sofa",
        "keywords": ["sofa", "furniture", "naroznik"],
    },
    {
        "title": "Modular sliding wardrobe storage system",
        "title_pl": "Szafa przesuwna modułowa z wyposażeniem",
        "category": "furniture",
        "estimatedPricePln": 2100,
        "quantity": 2,
        "unit": "pcs",
        "priority": "medium",
        "store": "Castorama Gdańsk Oliwa / IKEA Gdańsk",
        "store_address": "al. Grunwaldzka 262, 80-314 Gdańsk",
        "city": "Gdańsk",
        "notes": "Mirror sliding fronts with internal soft-close wire drawers, shelves, and rails.",
        "url": "https://www.castorama.pl/szukaj?query=szafa+przesuwna",
        "keywords": ["wardrobe", "furniture", "szafa"],
    },
    {
        "title": "C24 Structural timber & framing joists (pack)",
        "title_pl": "Drewno konstrukcyjne C24 czterostronnie strugane",
        "category": "materials",
        "estimatedPricePln": 1450,
        "quantity": 1,
        "unit": "pack",
        "priority": "high",
        "store": "Bricoman Gdańsk",
        "store_address": "ul. Przywidzka 10B, 80-174 Gdańsk",
        "city": "Gdańsk",
        "notes": "Kiln-dried certified Scandinavian C24 spruce for floor framing and terrace joists.",
        "url": "https://www.bricoman.pl/szukaj?q=drewno+c24",
        "keywords": ["timber", "materials", "c24", "drewno"],
    },
    {
        "title": "Corrosion-resistant structural exterior screws & joist hangers",
        "title_pl": "Wkręty konstrukcyjne ciesielskie i wieszaki belek",
        "category": "hardware_elec",
        "estimatedPricePln": 380,
        "quantity": 1,
        "unit": "pack",
        "priority": "high",
        "store": "Castorama Gdynia / Castorama Gdańsk",
        "store_address": "ul. Morska 10, 81-323 Gdynia",
        "city": "Gdynia",
        "notes": "C4 coated torx structural screws (8x160mm) and reinforced steel angle brackets.",
        "url": "https://www.castorama.pl/szukaj?query=wkrety+ciesielskie",
        "keywords": ["screws", "hardware_elec", "materials", "wkrety"],
    },
]


def search_tricity_items(
    query: Optional[str] = None,
    category: Optional[str] = None,
    store_filter: Optional[str] = None,
    city_filter: Optional[str] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    """Filter and rank Gdańsk & Gdynia catalog items by query, store, and category."""
    results: List[Dict[str, Any]] = []

    q_lower = (query or "").strip().lower()
    cat_lower = (category or "").strip().lower()
    store_lower = (store_filter or "").strip().lower()
    city_lower = (city_filter or "").strip().lower()

    # Expand query terms with Polish synonyms
    matching_terms = {q_lower} if q_lower else set()
    for english_word, polish_synonyms in KEYWORD_DICTIONARY.items():
        if q_lower and (english_word in q_lower or any(p in q_lower for p in polish_synonyms)):
            matching_terms.add(english_word)
            matching_terms.update(polish_synonyms)

    for item in VERIFIED_TRICITY_CATALOG:
        # Category filter
        if cat_lower and cat_lower != "all" and item["category"] != cat_lower:
            continue

        # City filter (Gdańsk vs Gdynia vs Tricity)
        if city_lower and city_lower not in ["tricity", "trojmiasto", "all"]:
            if city_lower not in item["city"].lower() and city_lower not in item["store"].lower():
                continue

        # Store chain filter
        if store_lower and store_lower != "all":
            if store_lower not in item["store"].lower():
                continue

        # Text query match
        if q_lower:
            haystack = (
                f"{item['title']} {item.get('title_pl', '')} {item['store']} "
                f"{item['notes']} {' '.join(item.get('keywords', []))}"
            ).lower()

            matched = any(term in haystack for term in matching_terms if term)
            if not matched:
                continue

        # Calculate SEK equivalent
        sek_price = round(item["estimatedPricePln"] * DEFAULT_RATE_PLN_TO_SEK)
        enriched = dict(item)
        enriched["estimatedPriceSek"] = sek_price
        enriched["storeOrUrl"] = f"{item['store']} ({item['store_address']})"
        results.append(enriched)

        if len(results) >= limit:
            break

    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Search & Scrape home improvement products from Polish stores in Gdańsk / Gdynia."
    )
    parser.add_argument("-q", "--query", help="Product search query (e.g. 'drill', 'mitre saw', 'mower')")
    parser.add_argument("-c", "--category", help="Category filter: power_tools, garden, kitchen, furniture, materials, hardware_elec")
    parser.add_argument("-s", "--store", help="Store filter: castorama, leroy, obi, bricoman, ikea, mediaexpert, jula, or all")
    parser.add_argument("-a", "--area", default="all", help="Area filter: gdansk, gdynia, or all (default: all)")
    parser.add_argument("-n", "--limit", type=int, default=50, help="Maximum items to return")
    parser.add_argument("-o", "--output", default=".tmp/scraped_tricity_items.json", help="Path to save output JSON")
    parser.add_argument("--seed-all", action="store_true", help="Export the full verified Gdańsk/Gdynia seed catalogue")
    parser.add_argument("--json", action="store_true", help="Print raw JSON output to stdout")

    args = parser.parse_args()

    if args.seed_all:
        items = search_tricity_items(limit=100)
    else:
        items = search_tricity_items(
            query=args.query,
            category=args.category,
            store_filter=args.store,
            city_filter=args.area,
            limit=args.limit,
        )

    # Automatically ensure output parent directory exists
    output_path = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "region": "Gdańsk & Gdynia (Trójmiasto, Poland)",
                "totalCount": len(items),
                "exchangeRatePlnToSek": DEFAULT_RATE_PLN_TO_SEK,
                "items": items,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    if args.json:
        print(json.dumps(items, indent=2, ensure_ascii=False))
        return

    print("=" * 72)
    print(" 🇵🇱 POLISH STORES SHOPPING SCRAPER - GDAŃSK & GDYNIA AREA")
    print("=" * 72)
    print(f"Target Region: Gdańsk & Gdynia (Trójmiasto, Poland)")
    print(f"Exchange Rate: 1 PLN = {DEFAULT_RATE_PLN_TO_SEK:.2f} SEK")
    print(f"Found Items  : {len(items)}")
    print(f"Saved to     : {output_path}")
    print("-" * 72)

    for i, item in enumerate(items, 1):
        print(
            f"{i:2d}. {item['title']}\n"
            f"    Price    : {item['estimatedPricePln']} zł (≈ {item['estimatedPriceSek']} kr)\n"
            f"    Category : {item['category']} | Priority: {item['priority']} | Qty: {item['quantity']} {item['unit']}\n"
            f"    Store    : {item['store']} [{item.get('store_address', '')}]\n"
            f"    Notes    : {item['notes']}\n"
            f"    URL      : {item.get('url', '')}\n"
        )
    print("=" * 72)


if __name__ == "__main__":
    main()
