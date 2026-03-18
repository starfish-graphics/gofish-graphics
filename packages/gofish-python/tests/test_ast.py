"""Tests for AST to IR conversion."""

import pytest
from gofish import (
    chart,
    spread,
    stack,
    derive,
    log,
    select,
    palette,
    gradient,
    normalize,
    repeat,
    rect,
    circle,
    line,
    area,
    ellipse,
    petal,
    text,
    image,
)
from gofish.ast import LayerSelector


class TestOperators:
    """Test operator creation and serialization."""

    def test_spread_operator_missing_dir(self):
        """Test spread operator requires dir."""
        with pytest.raises(ValueError, match="requires 'dir' option"):
            spread("field")

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

    def test_log_operator_no_label(self):
        """Test log operator without label."""
        op = log()
        assert op.op_type == "log"
        d = op.to_dict()
        assert d["type"] == "log"
        assert "label" not in d

    def test_log_operator_with_label(self):
        """Test log operator with label."""
        op = log("my label")
        d = op.to_dict()
        assert d["type"] == "log"
        assert d["label"] == "my label"


class TestMarkName:
    """Test Mark.name() method."""

    def test_name_returns_new_mark(self):
        """Test .name() returns a new Mark with name set."""
        m = rect(h="value")
        named = m.name("bars")
        assert named is not m
        assert named._name == "bars"
        assert m._name is None

    def test_name_in_to_dict(self):
        """Test name appears in to_dict() output."""
        m = rect(h="value").name("bars")
        d = m.to_dict()
        assert d["name"] == "bars"
        assert d["type"] == "rect"
        assert d["h"] == "value"

    def test_no_name_not_in_to_dict(self):
        """Test name not present in to_dict() when not set."""
        m = rect(h="value")
        d = m.to_dict()
        assert "name" not in d


class TestSelect:
    """Test select() and LayerSelector."""

    def test_select_returns_layer_selector(self):
        """Test select() returns a LayerSelector."""
        s = select("bars")
        assert isinstance(s, LayerSelector)
        assert s.layer_name == "bars"

    def test_chart_with_select_ir(self):
        """Test chart(select(...)) serializes data as select spec."""
        c = chart(select("bars")).mark(line())
        ir = c.to_ir()
        assert ir["data"] == {"type": "select", "layer": "bars"}

    def test_chart_with_regular_data_ir(self):
        """Test regular chart has null data in IR."""
        c = chart([{"x": 1}]).mark(rect(h="x"))
        ir = c.to_ir()
        assert ir["data"] is None


class TestColorConfig:
    """Test palette() and gradient() color config."""

    def test_palette_string(self):
        """Test palette() with string name."""
        p = palette("tableau10")
        assert p == {"_tag": "palette", "values": "tableau10"}

    def test_palette_list(self):
        """Test palette() with color list."""
        p = palette(["red", "blue", "green"])
        assert p == {"_tag": "palette", "values": ["red", "blue", "green"]}

    def test_gradient_string(self):
        """Test gradient() with single color."""
        g = gradient("blue")
        assert g == {"_tag": "gradient", "stops": "blue"}

    def test_gradient_list(self):
        """Test gradient() with stop list."""
        g = gradient(["#fff", "#000"])
        assert g == {"_tag": "gradient", "stops": ["#fff", "#000"]}

    def test_palette_in_chart_options(self):
        """Test palette flows through chart options to IR."""
        c = chart([{"x": 1}], {"color": palette("tableau10")}).mark(rect(h="x"))
        ir = c.to_ir()
        assert ir["options"]["color"] == {"_tag": "palette", "values": "tableau10"}


class TestDataUtilities:
    """Test normalize() and repeat() utilities."""

    def test_normalize(self):
        """Test normalize() sums field to 1."""
        data = [{"v": 1}, {"v": 3}]
        result = normalize(data, "v")
        assert result[0]["v"] == pytest.approx(0.25)
        assert result[1]["v"] == pytest.approx(0.75)

    def test_normalize_preserves_other_fields(self):
        """Test normalize() keeps non-normalized fields."""
        data = [{"cat": "a", "v": 2}, {"cat": "b", "v": 2}]
        result = normalize(data, "v")
        assert result[0]["cat"] == "a"
        assert result[1]["cat"] == "b"

    def test_normalize_zero_total(self):
        """Test normalize() returns data unchanged when total is 0."""
        data = [{"v": 0}, {"v": 0}]
        result = normalize(data, "v")
        assert result == data

    def test_repeat(self):
        """Test repeat() creates N copies of a row."""
        row = {"item": "apple", "count": 3}
        result = repeat(row, "count")
        assert len(result) == 3
        assert all(r == row for r in result)

    def test_repeat_zero(self):
        """Test repeat() with count of 0 returns empty list."""
        row = {"item": "apple", "count": 0}
        result = repeat(row, "count")
        assert result == []


class TestConvenienceMethods:
    """Test ChartBuilder.facet() and .stack() convenience methods."""

    def test_facet_adds_spread_operator(self):
        """Test .facet() adds a spread operator."""
        data = [{"cat": "a", "v": 1}]
        c = chart(data).facet("cat", dir="x")
        ir = c.mark(rect(h="v")).to_ir()
        ops = ir["operators"]
        assert len(ops) == 1
        assert ops[0]["type"] == "spread"
        assert ops[0]["field"] == "cat"
        assert ops[0]["dir"] == "x"

    def test_stack_shortcut_adds_stack_operator(self):
        """Test .stack() convenience method adds a stack operator."""
        data = [{"grp": "a", "v": 1}]
        c = chart(data).stack("grp", dir="y")
        ir = c.mark(rect(h="v")).to_ir()
        ops = ir["operators"]
        assert len(ops) == 1
        assert ops[0]["type"] == "stack"
        assert ops[0]["field"] == "grp"
        assert ops[0]["dir"] == "y"

    def test_facet_and_stack_chained(self):
        """Test chaining .facet() and .stack()."""
        data = [{"cat": "a", "grp": "x", "v": 1}]
        c = (
            chart(data)
            .facet("cat", dir="x")
            .stack("grp", dir="y")
            .mark(rect(h="v"))
        )
        ir = c.to_ir()
        ops = ir["operators"]
        assert len(ops) == 2
        assert ops[0]["type"] == "spread"
        assert ops[1]["type"] == "stack"


class TestNewMarks:
    """Test ellipse, petal, text, image marks."""

    def test_ellipse_mark(self):
        """Test ellipse mark creation."""
        m = ellipse(w=10, h=20, fill="blue")
        d = m.to_dict()
        assert d["type"] == "ellipse"
        assert d["w"] == 10
        assert d["h"] == 20
        assert d["fill"] == "blue"

    def test_petal_mark(self):
        """Test petal mark creation."""
        m = petal(w="size", h="size")
        d = m.to_dict()
        assert d["type"] == "petal"
        assert d["w"] == "size"
        assert d["h"] == "size"

    def test_text_mark(self):
        """Test text mark creation."""
        m = text(fill="black", label="name")
        d = m.to_dict()
        assert d["type"] == "text"
        assert d["fill"] == "black"
        assert d["label"] == "name"

    def test_image_mark(self):
        """Test image mark creation."""
        m = image(w=100, h=100, src="url")
        d = m.to_dict()
        assert d["type"] == "image"
        assert d["w"] == 100
        assert d["src"] == "url"

    def test_marks_support_name(self):
        """Test all marks support .name()."""
        for mark_fn in [
            lambda: ellipse(w=10),
            lambda: petal(w=10),
            lambda: text(fill="red"),
            lambda: image(w=10),
        ]:
            m = mark_fn().name("layer1")
            assert m._name == "layer1"
            assert m.to_dict()["name"] == "layer1"


class TestChartBuilder:
    """Test ChartBuilder and IR generation."""

    def test_to_ir_requires_mark(self):
        """Test to_ir() requires a mark."""
        data = [{"x": 1, "y": 2}]
        c = chart(data).flow(spread("x", dir="x"))
        with pytest.raises(ValueError, match="must have a mark"):
            c.to_ir()

    def test_to_ir_with_derive(self):
        """Test to_ir() with derive operator."""
        data = [{"x": 1, "y": 2}]
        fn = lambda d: d
        c = chart(data).flow(derive(fn)).mark(rect(h="y"))
        ir = c.to_ir()
        assert len(ir["operators"]) == 1
        assert ir["operators"][0]["type"] == "derive"
        assert "lambdaId" in ir["operators"][0]

    def test_to_ir_full_example(self):
        """Test a full chart spec round-trips to IR correctly."""
        data = [{"cat": "a", "grp": "x", "value": 1}]
        c = (
            chart(data, {"color": palette("tableau10")})
            .facet("cat", dir="x")
            .stack("grp", dir="y")
            .mark(rect(h="value", fill="grp").name("bars"))
        )
        ir = c.to_ir()

        assert ir["data"] is None
        assert ir["options"]["color"] == {"_tag": "palette", "values": "tableau10"}
        assert len(ir["operators"]) == 2
        assert ir["operators"][0]["type"] == "spread"
        assert ir["operators"][1]["type"] == "stack"
        assert ir["mark"]["type"] == "rect"
        assert ir["mark"]["name"] == "bars"
        assert ir["mark"]["h"] == "value"
        assert ir["mark"]["fill"] == "grp"

    def test_to_ir_select_with_line(self):
        """Test select() chart with line mark."""
        c = chart(select("bars")).mark(line())
        ir = c.to_ir()
        assert ir["data"] == {"type": "select", "layer": "bars"}
        assert ir["mark"]["type"] == "line"
