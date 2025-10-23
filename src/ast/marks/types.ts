export type ChartRect = {
    w?: number | string;
    h?: number | string;
    ts?: number | string;
    rs?: number | string;
    rx?: number;
    ry?: number;
    fill: string;
    debug?: boolean;
    filter?: string;
    label?: LabelAlignment;
};


export type VerticalAlignment = `${"y-start" | "y-middle" | "y-end"}${"" | `:${number}`}`;
export type HorizontalAlignment = `${"x-start" | "x-middle" | "x-end"}${"" | `:${number}`}`;

export type LabelAlignment =
    | `${VerticalAlignment}`
    | `${HorizontalAlignment}`
    | `${VerticalAlignment} + ${HorizontalAlignment}`
    | `${HorizontalAlignment} + ${VerticalAlignment}`