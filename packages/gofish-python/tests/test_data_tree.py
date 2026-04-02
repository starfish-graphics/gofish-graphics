"""Tests for the v2 data tree building (Python-side transforms)."""

import pytest
from gofish import chart, spread, stack, derive, group, scatter, rect
from gofish.ast import (
    _groupby_ordered,
    _infer_size,
    _collect_augmented_ops,
    _build_tree_only,
    DeriveOperator,
    Operator,
)


FISH_DATA = [
    {"species": "trout", "lake": "Erie", "count": 10, "size": 30},
    {"species": "trout", "lake": "Ontario", "count": 5, "size": 25},
    {"species": "bass", "lake": "Erie", "count": 8, "size": 40},
    {"species": "bass", "lake": "Ontario", "count": 12, "size": 35},
]


class TestGroupbyOrdered:
    def test_preserves_insertion_order(self):
        data = [{"k": "b"}, {"k": "a"}, {"k": "b"}, {"k": "c"}]
        result = _groupby_ordered(data, "k")
        assert list(result.keys()) == ["b", "a", "c"]

    def test_groups_correctly(self):
        result = _groupby_ordered(FISH_DATA, "species")
        assert set(result.keys()) == {"trout", "bass"}
        assert len(result["trout"]) == 2
        assert len(result["bass"]) == 2


class TestInferSize:
    def test_number_passthrough(self):
        assert _infer_size(42, FISH_DATA) == 42

    def test_field_sums(self):
        assert _infer_size("count", FISH_DATA) == 35  # 10+5+8+12

    def test_none_for_none(self):
        assert _infer_size(None, FISH_DATA) is None


class TestBuildTreeOnly:
    def test_no_operators_returns_leaf(self):
        tree = _build_tree_only(FISH_DATA, [])
        assert tree == {"data": FISH_DATA}

    def test_spread_groups_by_field(self):
        ops = [Operator("spread", field="species", dir="x")]
        tree = _build_tree_only(FISH_DATA, ops)
        assert "children" in tree
        assert len(tree["children"]) == 2
        keys = [c["key"] for c in tree["children"]]
        assert keys == ["trout", "bass"]

    def test_spread_children_are_leaves(self):
        ops = [Operator("spread", field="species", dir="x")]
        tree = _build_tree_only(FISH_DATA, ops)
        for child in tree["children"]:
            assert "data" in child
            assert "children" not in child

    def test_spread_no_field_enumerates(self):
        data = [{"v": 1}, {"v": 2}]
        ops = [Operator("spread", dir="x")]
        tree = _build_tree_only(data, ops)
        assert len(tree["children"]) == 2
        assert tree["children"][0]["key"] == "0"
        assert tree["children"][1]["key"] == "1"

    def test_nested_spread(self):
        ops = [
            Operator("spread", field="species", dir="x"),
            Operator("spread", field="lake", dir="y"),
        ]
        tree = _build_tree_only(FISH_DATA, ops)
        assert len(tree["children"]) == 2  # trout, bass
        trout = tree["children"][0]
        assert "children" in trout
        assert len(trout["children"]) == 2  # Erie, Ontario
        assert trout["children"][0]["key"] == "Erie"
        # Leaf level should have data
        assert "data" in trout["children"][0]

    def test_group_groups_by_field(self):
        ops = [Operator("group", field="species")]
        tree = _build_tree_only(FISH_DATA, ops)
        assert len(tree["children"]) == 2
        assert tree["children"][0]["key"] == "trout"

    def test_scatter_adds_centroids(self):
        ops = [Operator("scatter", field="species", x="count", y="size")]
        tree = _build_tree_only(FISH_DATA, ops)
        trout = tree["children"][0]
        bass = tree["children"][1]
        assert trout["x"] == pytest.approx(7.5)   # (10+5)/2
        assert trout["y"] == pytest.approx(27.5)  # (30+25)/2
        assert bass["x"] == pytest.approx(10.0)   # (8+12)/2
        assert bass["y"] == pytest.approx(37.5)   # (40+35)/2

    def test_table_creates_cells(self):
        ops = [Operator("table", xField="lake", yField="species")]
        tree = _build_tree_only(FISH_DATA, ops)
        # 2 lakes × 2 species = 4 cells
        assert len(tree["children"]) == 4
        # Cells have colKey/rowKey
        cell = tree["children"][0]
        assert "colKey" in cell
        assert "rowKey" in cell
        assert cell["colKey"] == "Erie"
        assert cell["rowKey"] == "trout"

    def test_derive_runs_eagerly(self):
        """derive transforms data and is consumed, not adding a tree level."""
        double_count = lambda d: [{**row, "count": row["count"] * 2} for row in d]
        ops = [DeriveOperator(double_count), Operator("spread", field="species", dir="x")]
        tree = _build_tree_only(FISH_DATA, ops)
        # Tree should have spread children (not derive level)
        trout_child = tree["children"][0]
        # Data should reflect doubled counts
        assert all(row["count"] == orig["count"] * 2
                   for row, orig in zip(trout_child["data"],
                                        [r for r in FISH_DATA if r["species"] == "trout"]))

    def test_derive_in_middle_of_flow(self):
        """derive in the middle runs per-group."""
        add_label = lambda d: [{**row, "label": row["species"].upper()} for row in d]
        ops = [
            Operator("spread", field="species", dir="x"),
            DeriveOperator(add_label),
        ]
        tree = _build_tree_only(FISH_DATA, ops)
        # derive ran per group, but since it's after spread, it runs on each group
        for child in tree["children"]:
            assert all("label" in row for row in child["data"])

    def test_log_is_transparent(self):
        """log operator does not create a tree level."""
        ops = [Operator("log"), Operator("spread", field="species", dir="x")]
        tree = _build_tree_only(FISH_DATA, ops)
        assert len(tree["children"]) == 2  # Same as without log


class TestCollectAugmentedOps:
    def test_spread_included(self):
        ops = [Operator("spread", field="species", dir="x")]
        result = _collect_augmented_ops(FISH_DATA, ops)
        assert len(result) == 1
        assert result[0]["type"] == "spread"
        assert result[0]["field"] == "species"

    def test_derive_excluded(self):
        ops = [DeriveOperator(lambda d: d), Operator("spread", field="species", dir="x")]
        result = _collect_augmented_ops(FISH_DATA, ops)
        assert len(result) == 1
        assert result[0]["type"] == "spread"

    def test_infer_size_w_as_field(self):
        ops = [Operator("spread", field="species", dir="x", w="count")]
        result = _collect_augmented_ops(FISH_DATA, ops)
        # w should be pre-computed: sum of count = 35
        assert result[0]["w"] == 35

    def test_infer_size_w_as_number(self):
        ops = [Operator("spread", field="species", dir="x", w=100)]
        result = _collect_augmented_ops(FISH_DATA, ops)
        assert result[0]["w"] == 100

    def test_table_includes_computed_keys(self):
        ops = [Operator("table", xField="lake", yField="species")]
        result = _collect_augmented_ops(FISH_DATA, ops)
        assert result[0]["numCols"] == 2
        assert result[0]["colKeys"] == ["Erie", "Ontario"]
        assert result[0]["rowKeys"] == ["trout", "bass"]

    def test_multiple_ops_in_order(self):
        ops = [
            Operator("spread", field="species", dir="x"),
            Operator("spread", field="lake", dir="y"),
        ]
        result = _collect_augmented_ops(FISH_DATA, ops)
        assert len(result) == 2
        assert result[0]["field"] == "species"
        assert result[1]["field"] == "lake"

    def test_derive_advances_data(self):
        """derive should update the running data so subsequent ops use transformed data."""
        add_total = lambda d: [{**row, "total": 999} for row in d]
        ops = [
            DeriveOperator(add_total),
            Operator("spread", field="species", dir="x"),
        ]
        result = _collect_augmented_ops(FISH_DATA, ops)
        # spread inferred size with w="total" should use post-derive data
        ops2 = [
            DeriveOperator(add_total),
            Operator("spread", field="species", dir="x", w="total"),
        ]
        result2 = _collect_augmented_ops(FISH_DATA, ops2)
        # total=999, 4 rows → sum = 3996
        assert result2[0]["w"] == 3996


class TestBuildV2Spec:
    """Integration tests for the full v2 spec via ChartBuilder."""

    def test_v2_spec_version(self):
        c = chart(FISH_DATA).flow(spread("species", dir="x")).mark(rect())
        tree, ops = c._build_v2_spec(FISH_DATA)
        assert "children" in tree
        assert len(ops) == 1

    def test_v2_spec_tree_keys_match_data(self):
        c = chart(FISH_DATA).flow(spread("species", dir="x")).mark(rect())
        tree, _ = c._build_v2_spec(FISH_DATA)
        keys = [child["key"] for child in tree["children"]]
        assert keys == ["trout", "bass"]

    def test_v2_spec_leaf_data_correct(self):
        c = chart(FISH_DATA).flow(spread("species", dir="x")).mark(rect())
        tree, _ = c._build_v2_spec(FISH_DATA)
        trout_data = tree["children"][0]["data"]
        assert len(trout_data) == 2
        assert all(r["species"] == "trout" for r in trout_data)

    def test_v2_spec_derive_stripped_from_ops(self):
        fn = lambda d: [{**r, "x": 1} for r in d]
        c = chart(FISH_DATA).flow(derive(fn), spread("species", dir="x")).mark(rect())
        _, ops = c._build_v2_spec(FISH_DATA)
        assert all(op["type"] != "derive" for op in ops)

    def test_v2_spec_nested_tree(self):
        c = (chart(FISH_DATA)
             .flow(spread("species", dir="x"), spread("lake", dir="y"))
             .mark(rect()))
        tree, ops = c._build_v2_spec(FISH_DATA)
        assert len(ops) == 2
        # Each species has 2 lake children
        for child in tree["children"]:
            assert "children" in child
            assert len(child["children"]) == 2
