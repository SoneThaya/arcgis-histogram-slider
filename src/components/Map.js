import React, { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";

const Map = () => {
  const MapEl = useRef(null);

  useEffect(() => {
    loadModules([
      "esri/views/SceneView",
      "esri/Map",
      "esri/layers/FeatureLayer",
      "esri/widgets/Expand",
      "esri/widgets/HistogramRangeSlider",
      "esri/smartMapping/statistics/histogram",
      "esri/core/promiseUtils",
    ]).then(
      ([
        SceneView,
        Map,
        FeatureLayer,
        Expand,
        HistogramRangeSlider,
        histogram,
        promiseUtils,
      ]) => {
        // flash flood warnings layer
        const layer = new FeatureLayer({
          portalItem: {
            id: "fded240144c74ce988771a503a3a03d8",
          },
          outFields: ["Temp"],
          // only display surface temperature data
          definitionExpression: "UnitTop = 0",
        });

        const map = new Map({
          basemap: "dark-gray-vector",
          layers: [layer],
        });

        const view = new SceneView({
          map: map,
          container: "viewDiv",
          camera: {
            position: {
              spatialReference: {
                wkid: 3857,
              },
              x: 6639903,
              y: -3314595,
              z: 14625266,
            },
            heading: 0,
            tilt: 0.15,
          },
        });

        view.whenLayerView(layer).then(function (layerView) {
          const field = "temp";
          const min = 0;
          const max = 30;

          histogram({
            layer: layer,
            field: field,
            numBins: 100,
            minValue: min,
            maxValue: max,
          }).then(function (histogramResponse) {
            const slider = new HistogramRangeSlider({
              bins: histogramResponse.bins,
              min: min,
              max: max,
              values: [min, max],
              excludedBarColor: "#524e4e",
              rangeType: "between",
              container: document.getElementById("slider-container"),
            });

            slider.on(
              ["thumb-change", "thumb-drag", "segment-drag"],
              function (event) {
                filterByHistogramRange(field).catch(function (error) {
                  if (error.name !== "AbortError") {
                    console.error(error);
                  }
                });
              }
            );

            const filterByHistogramRange = promiseUtils.debounce(function (
              field
            ) {
              layerView.filter = {
                where: slider.generateWhereClause(field),
              };
            });

            const filterExpand = new Expand({
              view: view,
              content: document.getElementById("controls"),
              expandIconClass: "esri-icon-filter",
              expanded: true,
            });

            view.ui.add(filterExpand, "bottom-left");
            view.ui.add("titleDiv", "top-right");
          });
        });
      }
    );
  }, []);

  return (
    <>
      <div
        id="viewDiv"
        style={{ height: "100vh", width: "100vw" }}
        ref={MapEl}
      ></div>
      <div id="titleDiv" class="esri-widget">
        <div id="titleText">Ecological Marine Units</div>
        <div>Indian Ocean</div>
      </div>
      <div id="controls" class="esri-widget">
        <div id="description" class="esri-widget">
          Surface Temperature (°C)
        </div>
        <div id="outer-container" class="esri-widget">
          <div id="slider-container"></div>
        </div>
      </div>
    </>
  );
};

export default Map;
