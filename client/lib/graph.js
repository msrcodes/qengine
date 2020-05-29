'use strict';

export class Graph extends HTMLElement {

    static get observedAttributes() {
        return ['data-value', 'data-title'];
    }

    constructor() {
        super();

        const shadow = this.attachShadow({mode: 'closed'});
        const container = document.createElement("div");

        const canvas = document.createElement('canvas');
        const heading = document.createElement("h3");

        const stylesheet = document.createElement('link');
        stylesheet.setAttribute('rel', 'stylesheet');
        stylesheet.setAttribute('type', 'text/css');
        stylesheet.setAttribute('href', 'lib/graph.css');

        container.append(heading, canvas);
        shadow.append(stylesheet, container);
        this.shadow = shadow;
    }

    calculateScaleFactor(data, height) {
        let min = 0;
        let max = 0;
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (value < min) {
                min = value
            }

            if (value > max) {
                max = value;
            }
        }
        return height / (max - min);
    }

    draw(spacing = 10) {
        const data = JSON.parse(this.getAttribute("data-value"));
        const canvas = this.shadow.querySelector("canvas");

        if (this.hasAttribute("data-title")) {
            this.shadow.querySelector("h3").textContent = this.getAttribute("data-title");
        } else {
            this.shadow.querySelector("h3").textContent = "";
        }

        if (canvas.getContext) {
            // establish variables
            const keys = Object.keys(data);
            const axisSize = spacing / 2;
            const offset = 20; // used for gap between axis and edge for labels
            const barWidth = (canvas.width - (spacing * (keys.length - 1)) - axisSize - offset) / keys.length;
            const scaleFactor = this.calculateScaleFactor(data, canvas.height - axisSize - offset - offset);
            const colour = `255, 51, 0`;
            let alpha = 1;

            // init canvas
            const ctx = canvas.getContext('2d', { alpha: false });
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);

            // draw axis
            ctx.fillStyle = "#000000";
            ctx.fillRect(offset, offset, axisSize, canvas.height - offset - offset);
            ctx.fillRect(offset, offset, canvas.width - offset, axisSize);

            // draw bars
            ctx.fillStyle = `rgba(${colour}, ${alpha})`;

            let x = 0;
            const values = [];
            for (const key of keys) {
                const value = data[key];
                values.push(value);
                ctx.fillRect(x + axisSize + offset, axisSize + offset, barWidth, value * scaleFactor);

                // label x-axis
                const c = ctx.getTransform();
                ctx.resetTransform();
                ctx.fillStyle = "#000000";
                ctx.fillText(key, x + axisSize + offset + (barWidth / 2), canvas.height - (offset / 2), barWidth);
                ctx.setTransform(c);

                ctx.fillStyle = `rgba(${colour}, ${alpha})`;

                x += spacing + barWidth;
                alpha -= (1 / keys.length);
            }

            ctx.resetTransform();

            // label y-axis
            ctx.fillStyle = "#000000";
            ctx.textAlign = "center";
            let val = Math.max(...values);

            const getGap = (val) => {
                if (val > 100) return 10;
                else if (val > 50) return 5;
                else if (val > 25) return 3;
                else if (val > 10) return 2;
                else return 1;
            };
            const gap = getGap(val);

            const y = (y) => {return canvas.height - (y * scaleFactor) - offset};
            while (val >= 0) {
                ctx.fillText(String(val), offset / 2, y(val));

                val -= gap;
            }

            ctx.resetTransform();
        } else {
            // TODO: canvas-unsupported code here
        }
    }

    // Called when graph is added to page
    connectedCallback() {
        this.draw();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.draw();
    }
}

customElements.define('custom-bar-graph', Graph);