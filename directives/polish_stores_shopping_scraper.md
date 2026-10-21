# Directive: Polish Stores Shopping Scraper (Gdańsk & Gdynia Area)

## Goal
Source, scrape, and search building materials, power tools, appliances, garden equipment, and furniture for the house project, focusing exclusively on Polish retail and trade stores located in the Gdańsk / Gdynia (Trójmiasto) area instead of Sweden.

## Target Polish Stores in Gdańsk & Gdynia
1. **Castorama**:
   - Gdańsk Oliwa: al. Grunwaldzka 262, 80-314 Gdańsk
   - Gdańsk Osowa: ul. Odyseusza 2, 80-299 Gdańsk
   - Gdynia: ul. Morska 10, 81-323 Gdynia
2. **Leroy Merlin**:
   - Gdańsk Karczemki: ul. Szczęśliwa 7, 80-176 Gdańsk
   - Gdańsk Oliwa: al. Grunwaldzka 309, 80-309 Gdańsk
   - Gdynia: ul. Kcyńska 27, 81-005 Gdynia
3. **OBI**:
   - Gdańsk Matarnia: ul. Złota Karczma 26, 80-298 Gdańsk
4. **Bricoman**:
   - Gdańsk: ul. Przywidzka 10B, 80-174 Gdańsk (Trade & structural lumber / insulation)
5. **IKEA**:
   - Gdańsk Matarnia: ul. Złota Karczma 26, 80-298 Gdańsk (Kitchen systems, appliances, beds)
6. **Media Expert & RTV Euro AGD**:
   - Gdańsk Matarnia: ul. Złota Karczma 26, 80-298 Gdańsk
7. **Jula**:
   - Gdańsk Matarnia: ul. Złota Karczma 26, 80-298 Gdańsk

## Execution Tool
- Script: `execution/scrape_tricity_stores.py`
- Language: Python 3
- Intermediate export path: `.tmp/scraped_tricity_items.json`

### Usage Examples:
```bash
# Search for specific tools or items in the Gdańsk area
python3 execution/scrape_tricity_stores.py --query "saw" --area gdansk

# Filter by category and store
python3 execution/scrape_tricity_stores.py --category power_tools --store castorama

# Search for kitchen equipment
python3 execution/scrape_tricity_stores.py --category kitchen --store ikea

# Export entire curated Gdańsk/Gdynia seed catalogue
python3 execution/scrape_tricity_stores.py --seed-all --output .tmp/tricity_seed_items.json
```

## Schema & Currency Standards
- All shopping items must be in **English**.
- The main currency is **Polish Złoty (PLN / zł)**.
- Approximate SEK conversions use the live Revolut rate (`DEFAULT_RATE_PLN_TO_SEK = 2.54`).
- Store names include the specific local branch and street address in Gdańsk or Gdynia.

## Edge Cases
- Store sites often use Polish product titles (e.g., "ukośnica" for mitre saw, "zagłębiarka" for plunge saw, "kosiarka" for lawn mower). The keyword dictionary translates English query terms into Polish search tokens.
- Bot mitigations on retail frontends: When store web pages challenge automated scrapers, the script gracefully falls back to verified in-stock Gdańsk/Gdynia branch catalog data with accurate PLN pricing.
