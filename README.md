# Stage-2-Backend-Intelligence-Query-Engine-Assessment

## Endpoints

```
GET    /api/profiles
GET    /api/profiles/search

```

---

## GET /api/profiles — Filters, Sorting & Pagination

### Supported filters
| Parameter               | Type   | Example         |
|------------------------|--------|-----------------|
| gender                 | string | male / female   |
| age_group              | string | adult           |
| country_id             | string | NG              |
| min_age                | int    | 25              |
| max_age                | int    | 50              |
| min_gender_probability | float  | 0.8             |
| min_country_probability| float  | 0.7             |

### Sorting
- `sort_by` → `age` | `created_at` | `gender_probability`
- `order` → `asc` | `desc`

### Pagination
- `page` (default: 1)
- `limit` (default: 10, max: 50)

### Example
```
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

---

## GET /api/profiles/search — Natural Language Query

```
GET /api/profiles/search?q=young males from nigeria
```

### How parsing works

The parser uses rule-based keyword matching on the lowercased query string. No AI or LLMs are used.

**Gender keywords**
| Keyword | Maps to |
|---------|---------|
| male / males | gender=male |
| female / females | gender=female |

**Age group keywords**
| Keyword | Maps to |
|---------|---------|
| child / children | age_group=child |
| teenager / teenagers | age_group=teenager |
| adult / adults | age_group=adult |
| senior / seniors | age_group=senior |
| young | min_age=16 + max_age=24 |

**Age comparison keywords**
| Keyword | Maps to |
|---------|---------|
| above {n} | min_age=n |
| below {n} | max_age=n |
| older than {n} | min_age=n |
| younger than {n} | max_age=n |
| between {n} and {m} | min_age=n + max_age=m |

**Country keywords**

Country names are matched from a predefined map (e.g. "nigeria" → NG, "kenya" → KE). The parser looks for the pattern `from {country}` in the query.

### Example mappings
| Query | Parsed filters |
|-------|---------------|
| young males | gender=male, min_age=16, max_age=24 |
| females above 30 | gender=female, min_age=30 |
| people from angola | country_id=AO |
| adult males from kenya | gender=male, age_group=adult, country_id=KE |
| male and female teenagers above 17 | age_group=teenager, min_age=17 |

### Uninterpretable queries
If no filters can be parsed from the query:
```json
{ "status": "error", "message": "Unable to interpret query" }
```

---

## Limitations

- Country matching is limited to a predefined list of ~40 countries. Unlisted countries will not be matched even if spelled correctly.
- "young" is a parsing-only keyword — it maps to ages 16–24 and is not a stored age group.
- The parser does not handle negations (e.g. "not from nigeria", "non-adults").
- Multiple countries in one query are not supported (e.g. "from nigeria or ghana").
- Ambiguous queries like "people over 18" without gender or country context will still be parsed if age is extractable.
- Typos and abbreviations (e.g. "nig" for Nigeria) are not handled.
- "male and female" together — gender filter is skipped since both genders are implied.