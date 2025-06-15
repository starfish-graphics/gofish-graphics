export default {
  load() {
    return [
      {
        id: "scatter-plot",
        title: "Basic Scatter Plot",
        description:
          "A simple scatter plot showing correlation between two variables",
        thumbnail: "/examples/scatter-plot.png",
        demoUrl: "/examples/scatter-plot",
        codeUrl: "https://github.com/your-repo/examples/scatter-plot",
        tags: {
          marks: ["point", "circle"],
          operators: ["scale", "encoding"],
          chartTypes: ["scatter", "correlation", "bivariate"],
        },
      },
      {
        id: "bar-chart",
        title: "Grouped Bar Chart",
        description: "Multi-series bar chart with grouping",
        thumbnail: "/examples/bar-chart.png",
        demoUrl: "/examples/bar-chart",
        codeUrl: "https://github.com/your-repo/examples/bar-chart",
        tags: {
          marks: ["rect", "bar"],
          operators: ["group", "aggregate"],
          chartTypes: ["bar", "categorical", "comparison"],
        },
      },
      {
        id: "line-chart",
        title: "Time Series Line Chart",
        description: "Line chart showing data over time",
        thumbnail: "/examples/line-chart.png",
        demoUrl: "/examples/line-chart",
        codeUrl: "https://github.com/your-repo/examples/line-chart",
        tags: {
          marks: ["line", "point"],
          operators: ["scale", "axis"],
          chartTypes: ["line", "time-series", "trend"],
        },
      },
      {
        id: "heatmap",
        title: "Correlation Heatmap",
        description: "Heatmap showing correlation matrix",
        thumbnail: "/examples/heatmap.png",
        demoUrl: "/examples/heatmap",
        codeUrl: "https://github.com/your-repo/examples/heatmap",
        tags: {
          marks: ["rect", "cell"],
          operators: ["color", "scale"],
          chartTypes: ["heatmap", "matrix", "correlation"],
        },
      },
    ];
  },
};
