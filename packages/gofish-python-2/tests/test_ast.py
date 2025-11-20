"""Tests for AST to IR conversion."""

import json
import pytest
from gofish import (
    chart,
    spread,
    stack,
    derive,
    group,
    scatter,
    rect,
    circle,
    line,
    area,
    scaffold,
)


class TestOperators:
    """Test operator creation and serialization."""

    def test_spread_operator(self):
        """Test spread operator with field and options."""
        op = spread("lake", dir="x", spacing=8)
        assert op.op_type == "spread"
        assert op.to_dict() == {
            "type": "spread",
            "field": "lake",
            "dir": "x",
            "spacing": 8,
        }

    def test_spread_operator_dict_options(self):
        """Test spread operator with dict options."""
        op = spread({"field": "category", "dir": "y", "spacing": 16})
        assert op.to_dict() == {
            "type": "spread",
            "field": "category",
            "dir": "y",
            "spacing": 16,
        }

    def test_spread_operator_missing_dir(self):
        """Test spread operator requires dir."""
        with pytest.raises(ValueError, match="requires 'dir' option"):
            spread("field")

    def test_stack_operator(self):
        """Test stack operator."""
        op = stack("species", dir="y", spacing=0)
        assert op.op_type == "stack"
        assert op.to_dict() == {
            "type": "stack",
            "field": "species",
            "dir": "y",
            "spacing": 0,
        }

    def test_stack_operator_positional_dir(self):
        """Test stack operator with positional dir."""
        op = stack("species", "y")
        assert op.to_dict() == {
            "type": "stack",
            "field": "species",
            "dir": "y",
        }

    def test_stack_operator_missing_dir(self):
        """Test stack operator requires dir."""
        with pytest.raises(ValueError, match="requires 'dir' option"):
            stack("field")

    def test_derive_operator(self):
        """Test derive operator."""
        fn = lambda d: d
        op = derive(fn)
        assert op.op_type == "derive"
        assert op.fn is fn
        assert "lambdaId" in op.to_dict()
        assert op.to_dict()["type"] == "derive"

    def test_derive_operator_unique_ids(self):
        """Test derive operators have unique lambda IDs."""
        fn = lambda d: d
        op1 = derive(fn)
        op2 = derive(fn)
        assert op1.lambda_id != op2.lambda_id

    def test_group_operator(self):
        """Test group operator."""
        op = group("category")
        assert op.op_type == "group"
        assert op.to_dict() == {
            "type": "group",
            "field": "category",
        }

    def test_scatter_operator(self):
        """Test scatter operator."""
        op = scatter("lake", x="x", y="y")
        assert op.op_type == "scatter"
        assert op.to_dict() == {
            "type": "scatter",
            "field": "lake",
            "x": "x",
            "y": "y",
        }


class TestMarks:
    """Test mark creation and serialization."""

    def test_rect_mark(self):
        """Test rect mark."""
        m = rect(h="count", fill="species", w=32)
        assert m.mark_type == "rect"
        assert m.to_dict() == {
            "type": "rect",
            "h": "count",
            "fill": "species",
            "w": 32,
        }

    def test_rect_mark_minimal(self):
        """Test rect mark with minimal options."""
        m = rect()
        assert m.to_dict() == {"type": "rect"}

    def test_circle_mark(self):
        """Test circle mark."""
        m = circle(r=5, fill="blue", stroke="black", strokeWidth=2)
        assert m.mark_type == "circle"
        assert m.to_dict() == {
            "type": "circle",
            "r": 5,
            "fill": "blue",
            "stroke": "black",
            "strokeWidth": 2,
        }

    def test_line_mark(self):
        """Test line mark."""
        m = line(stroke="blue", strokeWidth=2, opacity=0.8)
        assert m.mark_type == "line"
        assert m.to_dict() == {
            "type": "line",
            "stroke": "blue",
            "strokeWidth": 2,
            "opacity": 0.8,
        }

    def test_area_mark(self):
        """Test area mark."""
        m = area(opacity=0.8, mixBlendMode="multiply", dir="x")
        assert m.mark_type == "area"
        assert m.to_dict() == {
            "type": "area",
            "opacity": 0.8,
            "mixBlendMode": "multiply",
            "dir": "x",
        }

    def test_scaffold_mark(self):
        """Test scaffold mark."""
        m = scaffold(w=100, h=100)
        assert m.mark_type == "scaffold"
        assert m.to_dict() == {
            "type": "scaffold",
            "w": 100,
            "h": 100,
        }


class TestChartBuilder:
    """Test ChartBuilder and IR generation."""

    def test_chart_creation(self):
        """Test creating a chart."""
        data = [{"x": 1, "y": 2}]
        c = chart(data)
        assert c.data == data
        assert c.options == {}
        assert c.operators == []

    def test_chart_with_options(self):
        """Test chart with options."""
        data = [{"x": 1, "y": 2}]
        c = chart(data, options={"w": 800, "h": 600})
        assert c.options == {"w": 800, "h": 600}

    def test_flow_adds_operators(self):
        """Test flow() adds operators."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).flow(spread("x", dir="x"), stack("y", dir="y"))
        assert len(c.operators) == 2
        assert c.operators[0].op_type == "spread"
        assert c.operators[1].op_type == "stack"

    def test_flow_returns_new_builder(self):
        """Test flow() returns new builder (immutability)."""
        data = [{"x": 1, "y": 2}]
        c1 = chart(data)
        c2 = c1.flow(spread("x", dir="x"))
        assert c1 is not c2
        assert len(c1.operators) == 0
        assert len(c2.operators) == 1

    def test_mark_sets_mark(self):
        """Test mark() sets the mark."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).mark(rect(h="y"))
        assert c._mark is not None
        assert c._mark.mark_type == "rect"

    def test_mark_returns_new_builder(self):
        """Test mark() returns new builder."""
        data = [{"x": 1, "y": 2}]
        c1 = chart(data)
        c2 = c1.mark(rect(h="y"))
        assert c1 is not c2
        assert c1._mark is None
        assert c2._mark is not None

    def test_to_ir_requires_mark(self):
        """Test to_ir() requires a mark."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).flow(spread("x", dir="x"))
        with pytest.raises(ValueError, match="must have a mark"):
            c.to_ir()

    def test_to_ir_simple(self):
        """Test to_ir() with simple chart."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).mark(rect(h="y"))
        ir = c.to_ir()
        assert ir == {
            "data": None,
            "operators": [],
            "mark": {"type": "rect", "h": "y"},
            "options": {},
        }

    def test_to_ir_with_operators(self):
        """Test to_ir() with operators."""
        data = [{"x": 1, "y": 2}]
        c = (
            chart(data)
            .flow(spread("lake", dir="x", spacing=8), stack("species", dir="y"))
            .mark(rect(h="count", fill="species"))
        )
        ir = c.to_ir()
        assert ir["data"] is None
        assert len(ir["operators"]) == 2
        assert ir["operators"][0] == {
            "type": "spread",
            "field": "lake",
            "dir": "x",
            "spacing": 8,
        }
        assert ir["operators"][1] == {
            "type": "stack",
            "field": "species",
            "dir": "y",
        }
        assert ir["mark"] == {
            "type": "rect",
            "h": "count",
            "fill": "species",
        }
        assert ir["options"] == {}

    def test_to_ir_with_options(self):
        """Test to_ir() includes options."""
        data = [{"x": 1, "y": 2}]
        c = chart(data, options={"w": 800, "h": 600}).mark(rect(h="y"))
        ir = c.to_ir()
        assert ir["options"] == {"w": 800, "h": 600}

    def test_to_ir_with_derive(self):
        """Test to_ir() with derive operator."""
        data = [{"x": 1, "y": 2}]
        fn = lambda d: d.sort_values("y")
        c = chart(data).flow(derive(fn)).mark(rect(h="y"))
        ir = c.to_ir()
        assert len(ir["operators"]) == 1
        assert ir["operators"][0]["type"] == "derive"
        assert "lambdaId" in ir["operators"][0]

    def test_to_ir_json_serializable(self):
        """Test that IR is JSON serializable."""
        data = [{"x": 1, "y": 2}]
        c = (
            chart(data)
            .flow(
                spread("lake", dir="x", spacing=8),
                stack("species", dir="y"),
                group("category"),
            )
            .mark(rect(h="count", fill="species", w=32))
        )
        ir = c.to_ir()
        # Should not raise
        json_str = json.dumps(ir)
        assert isinstance(json_str, str)
        # Should be able to parse back
        parsed = json.loads(json_str)
        assert parsed == ir

    def test_fluent_api_example(self):
        """Test a realistic fluent API example."""
        data = [{"lake": "A", "species": "B", "count": 10}]
        c = (
            chart(data, options={"w": 800, "h": 600})
            .flow(
                spread("lake", dir="x", spacing=64),
                stack("species", dir="y", spacing=0),
            )
            .mark(rect(h="count", fill="species"))
        )
        ir = c.to_ir()
        assert ir["data"] is None
        assert len(ir["operators"]) == 2
        assert ir["mark"]["type"] == "rect"
        assert ir["options"]["w"] == 800
        assert ir["options"]["h"] == 600

    def test_multiple_marks_chain(self):
        """Test that mark() can be called multiple times (last one wins)."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).mark(rect(h="y")).mark(circle(r=5))
        ir = c.to_ir()
        assert ir["mark"]["type"] == "circle"

    def test_all_operator_types(self):
        """Test all operator types in one chart."""
        data = [{"x": 1, "y": 2}]
        c = (
            chart(data)
            .flow(
                spread("field1", dir="x"),
                stack("field2", dir="y"),
                group("field3"),
                scatter("field4", x="x", y="y"),
            )
            .mark(rect(h="y"))
        )
        ir = c.to_ir()
        assert len(ir["operators"]) == 4
        assert ir["operators"][0]["type"] == "spread"
        assert ir["operators"][1]["type"] == "stack"
        assert ir["operators"][2]["type"] == "group"
        assert ir["operators"][3]["type"] == "scatter"

    def test_all_mark_types(self):
        """Test all mark types."""
        data = [{"x": 1, "y": 2}]
        marks = [
            rect(h="y"),
            circle(r=5),
            line(stroke="blue"),
            area(opacity=0.8),
            scaffold(w=100, h=100),
        ]
        for mark in marks:
            c = chart(data).mark(mark)
            ir = c.to_ir()
            assert ir["mark"]["type"] == mark.mark_type






