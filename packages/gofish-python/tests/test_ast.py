"""Tests for AST to IR conversion."""

import pytest
from gofish import (
    chart,
    spread,
    stack,
    derive,
    rect,
)


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
        fn = lambda d: d.sort_values("y")
        c = chart(data).flow(derive(fn)).mark(rect(h="y"))
        ir = c.to_ir()
        assert len(ir["operators"]) == 1
        assert ir["operators"][0]["type"] == "derive"
        assert "lambdaId" in ir["operators"][0]
