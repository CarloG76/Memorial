# MEMORIAL — mappa funzionale dei contenuti del memoriale

Revisionata il 15 novembre 2026. Questa mappa fotografa il codice e lo schema DEMO attualmente in uso; il modello futuro non va confuso con una schermata di prova.

| Informazione | Sorgente Supabase oggi | Sezione editor | Visualizzazione pubblica |
| --- | --- | --- | --- |
| Persona, nascita, decesso, livello, visibilità, stato | `memorials.deceased_name/birth_date/death_date/tier/visibility/status` | Profilo / stato e pubblicazione | Hero, dati generali |
| Dedica | `memorial_public_demo_profiles.dedication` | Profilo e Biografia | Hero |
| **Biografia** (descrizione della persona) | `memorial_public_demo_profiles.biography` | Profilo e Biografia | Introduzione «Un ricordo che continua» |
| **Storia** (tappe della vita) | `memorial_public_demo_profiles.highlights` JSON array, **non** `story` | Storia: righe Data, Titolo facoltativo, Didascalia | Timeline «La sua storia» |
| Ritratto e fuoco | `memorial_public_demo_profiles.portrait_url/portrait_focus_x` | Profilo e media | Hero |
| Sfondo | `memorial_visual_settings.published_preset` | Tema/sfondo | Hero, preset pubblicato |
| Galleria | `memorial_public_demo_photos` | Foto | Sezione Ricordi (Premium) |
| Ricordi testuali | `memorial_memories` | Ricordi + moderazione | Solo APPROVED |
| Pensieri | `memorial_thoughts` | Pensieri + moderazione | Solo APPROVED |
| Member della famiglia | `family_members` | Famiglia e contatti | Non pubblicati |

## Contratto delle tappe
Ogni tappa contiene `date` (stringa), `title` facoltativo, `detail` obbligatoria. La data accetta `AAAA`, `MM-AAAA`, `GG-MM-AAAA` (validare giorno/mese e bisestili); il dato resta testuale per non inventare precisione. L'array mantiene l'ordine scelto dalla famiglia. Fino a 30 tappe, titolo 180 caratteri e didascalia 2000.

Le voci legacy DEMO `{year,title,detail}` restano leggibili; al primo salvataggio si trasformano in `{date,title,detail}`. **Non** mescolare la timeline con la biografia né con `memorial_memories`: sono entità semanticamente diverse.

La colonna `memorial_public_demo_profiles.story` introdotta in una migrazione provvisoria è **legacy non utilizzata nel rendering e negli editor correnti**. Non eliminarla automaticamente: potrebbe contenere testo inserito e necessita di un intervento migratorio dedicato in futuro.

## Sicurezza e flussi
La scrittura SuperAdmin usa le RPC owner-scoped `platform_update_memorial_presentation` e `platform_context_update_family`; la lettura pubblica usa `get_public_memorial_demo`, che è già vincolata a memoriale DEMO pubblicato e PUBLIC. La famiglia reale dovrà avere le stesse capacità tramite permessi tenant verificati e non tramite un grant pubblico alla tabella. Non esporre contatti privati o contributi pending. Qualunque evoluzione del reset DEMO deve coprire `highlights` e la baseline dei 12 memoriali.
