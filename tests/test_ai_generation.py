from __future__ import annotations

import unittest

from scripts.generate_ai_reports import canonical_input, input_hash, validate_output


class AiGenerationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.item = {
            "company": "Örnek Sanayi A.Ş.",
            "capitalIncreaseShares": 80,
            "shareholderSaleShares": 20,
            "extraSaleShares": 0,
            "fundUse": [{"label": "Yatırım", "value": 60}],
            "financials": [],
            "risks": ["Finansal tablolar henüz işlenmedi."],
            "sources": [{"title": "SPK Bülteni", "url": "https://example.com/spk.pdf", "page": "1"}],
            "unrelatedUiField": "hash girdisine girmemeli",
        }

    def test_hash_is_stable_for_same_source_facts(self) -> None:
        first = input_hash(self.item)
        reordered = dict(reversed(list(self.item.items())))
        self.assertEqual(first, input_hash(reordered))

    def test_hash_changes_when_material_fact_changes(self) -> None:
        changed = dict(self.item)
        changed["shareholderSaleShares"] = 25
        self.assertNotEqual(input_hash(self.item), input_hash(changed))

    def test_canonical_input_drops_unrelated_fields(self) -> None:
        result = canonical_input(self.item)
        self.assertNotIn("unrelatedUiField", result)
        self.assertEqual(result["company"], "Örnek Sanayi A.Ş.")

    def test_safe_model_output_is_accepted(self) -> None:
        validate_output({
            "summary": "Kaynaklı veriler sermaye artırımının daha yüksek olduğunu gösteriyor.",
            "strengths": ["Sermaye artırımı payı daha yüksektir."],
            "risks": ["Finansal tablo henüz işlenmedi."],
        })

    def test_investment_direction_language_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            validate_output({
                "summary": "Bu halka arz kesin kazanç sağlar.",
                "strengths": [],
                "risks": [],
            })

    def test_missing_arrays_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            validate_output({"summary": "Kaynaklı özet"})


if __name__ == "__main__":
    unittest.main()
