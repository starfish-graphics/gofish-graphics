import marimo

app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import sys
    import pathlib

    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    return mo, pathlib, sys


@app.cell
def _(mo):
    # ── Import all working story functions ──────────────────────────────────

    from stories.forwardsyntax.bar.bar_basic import default as bar_basic
    from stories.forwardsyntax.bar.bar_grouped import default as bar_grouped
    from stories.forwardsyntax.bar.bar_stacked import default as bar_stacked
    from stories.forwardsyntax.bar.bar_stacked_fluent import default as bar_stacked_fluent
    from stories.forwardsyntax.bar.bar_horizontal import default as bar_horizontal
    from stories.forwardsyntax.bar.bar_negative import default as bar_negative
    from stories.forwardsyntax.bar.bar_sorted_stacked import default as bar_sorted_stacked
    from stories.forwardsyntax.bar.bar_stacked_with_labels import default as bar_stacked_with_labels
    from stories.forwardsyntax.mosaic_chart import default as mosaic_chart
    from stories.forwardsyntax.scatter import basic as scatter_basic
    from stories.forwardsyntax.pie import basic as pie_basic
    from stories.forwardsyntax.pie import donut as pie_donut
    from stories.forwardsyntax.pie import rose as pie_rose
    from stories.forwardsyntax.ribbon import basic as ribbon_basic
    from stories.forwardsyntax.ribbon import polar as ribbon_polar
    from stories.forwardsyntax.line_chart import default as line_chart
    from stories.forwardsyntax.streamgraph import default as streamgraph
    from stories.forwardsyntax.scatter_connected import connected as scatter_connected
    from stories.vega_lite.simple_bar_chart import default as vl_simple_bar
    from stories.vega_lite.grouped_bar_chart import default as vl_grouped_bar

    EXAMPLES = [
        ("Bar / Basic", bar_basic),
        ("Bar / Grouped", bar_grouped),
        ("Bar / Stacked", bar_stacked),
        ("Bar / Stacked (Fluent)", bar_stacked_fluent),
        ("Bar / Horizontal", bar_horizontal),
        ("Bar / Negative", bar_negative),
        ("Bar / Sorted & Stacked", bar_sorted_stacked),
        ("Bar / Stacked with Labels", bar_stacked_with_labels),
        ("Mosaic Chart", mosaic_chart),
        ("Scatter / Basic", scatter_basic),
        ("Scatter / Connected", scatter_connected),
        ("Line Chart", line_chart),
        ("Streamgraph", streamgraph),
        ("Ribbon / Basic", ribbon_basic),
        ("Ribbon / Polar", ribbon_polar),
        ("Pie / Basic", pie_basic),
        ("Pie / Donut", pie_donut),
        ("Pie / Rose (Nightingale)", pie_rose),
        ("Vega-Lite / Simple Bar", vl_simple_bar),
        ("Vega-Lite / Grouped Bar", vl_grouped_bar),
    ]

    n = len(EXAMPLES)

    idx = mo.ui.slider(
        0,
        n - 1,
        value=0,
        show_value=False,
        full_width=True,
    )

    return EXAMPLES, idx, n


@app.cell
def _(EXAMPLES, idx, mo, n):
    # Global keyboard handler: arrow keys advance/rewind the slider.
    keyboard_nav = mo.Html("""
    <script>
    (function () {
        if (window.__gofishKeyHandlerInstalled) return;
        window.__gofishKeyHandlerInstalled = true;

        document.addEventListener('keydown', function (e) {
            // Don't hijack arrow keys when typing in inputs / textareas
            var tag = document.activeElement ? document.activeElement.tagName : '';
            if (tag === 'TEXTAREA' || (tag === 'INPUT' && document.activeElement.type !== 'range')) return;

            var slider = document.querySelector('input[type="range"]');
            if (!slider) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                var v = Math.max(parseInt(slider.min || '0'), parseInt(slider.value) - 1);
                slider.value = String(v);
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                var v = Math.min(parseInt(slider.max), parseInt(slider.value) + 1);
                slider.value = String(v);
                slider.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    })();
    </script>
    """)

    name, story_fn = EXAMPLES[idx.value]
    widget = story_fn().render(w=700, h=500, axes=True)

    mo.vstack(
        [
            keyboard_nav,
            mo.hstack(
                [
                    mo.md(f"## {name}"),
                    mo.md(f"*{idx.value + 1} / {n}*"),
                ],
                justify="space-between",
                align="center",
            ),
            idx,
            widget,
        ],
        gap="0.5rem",
    )


if __name__ == "__main__":
    app.run()
