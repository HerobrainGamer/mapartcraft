import React, { Component } from "react";
import { gzip } from "pako";

import AutoCompleteInputBlockToAdd from "./autoCompleteInputBlockToAdd/autoCompleteInputBlockToAdd";

import DitherMethods from "./ditherMethods.json";
import Tooltip from "../tooltip";
import coloursJSON from "./coloursJSON.json";

import NBTWorker from "./workers/nbt.jsworker";

import "./mapSettings.css";

class MapSettings extends Component {
  state = {
    buttonWidth_NBT_Joined: 1,
    buttonWidth_NBT_Split: 1,
    buttonWidth_Mapdat_Split: 1,
    mapPreviewWorker_onFinishCallback: null,
  };

  nbtWorker = new Worker(NBTWorker);

  resetButtonWidths() {
    this.setState({ buttonWidth_NBT_Joined: 1, buttonWidth_NBT_Split: 1, buttonWidth_Mapdat_Split: 1 });
  }

  getNBT_base = (workerHeader) => {
    const {
      getLocaleString,
      supportedVersions,
      optionValue_version,
      optionValue_staircasing,
      optionValue_whereSupportBlocks,
      optionValue_supportBlock,
      uploadedImage_baseFilename,
      currentMaterialsData,
      downloadBlobFile,
      mapPreviewWorker_inProgress,
    } = this.props;
    if (mapPreviewWorker_inProgress) {
      this.setState({ mapPreviewWorker_onFinishCallback: () => this.getNBT_base(workerHeader) });
      return;
    }
    if (Object.entries(currentMaterialsData.currentSelectedBlocks).every((elt) => elt[1] === "-1")) {
      alert(getLocaleString("DOWNLOAD/ERROR-NONE-SELECTED"));
      return;
    }
    this.nbtWorker.terminate();
    this.resetButtonWidths();
    const t0 = performance.now();
    this.nbtWorker = new Worker(NBTWorker);
    this.nbtWorker.onmessage = (e) => {
      switch (e.data.head) {
        case "PROGRESS_REPORT_NBT_JOINED": {
          this.setState({ buttonWidth_NBT_Joined: e.data.body });
          break;
        }
        case "PROGRESS_REPORT_NBT_SPLIT": {
          this.setState({ buttonWidth_NBT_Split: e.data.body });
          break;
        }
        case "PROGRESS_REPORT_MAPDAT_SPLIT": {
          this.setState({ buttonWidth_Mapdat_Split: e.data.body });
          break;
        }
        case "NBT_ARRAY": {
          const t1 = performance.now();
          console.log(`Created NBT by ${(t1 - t0).toString()}ms`);
          const { NBT_Array, whichMap_x, whichMap_y } = e.data.body;
          downloadBlobFile(
            gzip(NBT_Array),
            "application/x-minecraft-level",
            workerHeader === "CREATE_NBT_SPLIT" ? `${uploadedImage_baseFilename}_${whichMap_x}_${whichMap_y}.nbt` : `${uploadedImage_baseFilename}.nbt`
          );
          break;
        }
        case "MAPDAT_BYTES": {
          const t1 = performance.now();
          console.log(`Created Mapdat by ${(t1 - t0).toString()}ms`);
          const { Mapdat_Bytes, whichMap_x, whichMap_y } = e.data.body;
          downloadBlobFile(gzip(Mapdat_Bytes), "application/x-minecraft-map", `${uploadedImage_baseFilename}_${whichMap_x}_${whichMap_y}.dat`);
          break;
        }
        default: {
          throw new Error("Unknown worker response header");
        }
      }
    };
    this.nbtWorker.postMessage({
      head: workerHeader,
      body: {
        coloursJSON: coloursJSON,
        supportedVersions: supportedVersions,
        optionValue_version: optionValue_version,
        optionValue_staircasing: optionValue_staircasing,
        optionValue_whereSupportBlocks: optionValue_whereSupportBlocks,
        optionValue_supportBlock: optionValue_supportBlock,
        maps: currentMaterialsData.maps,
        currentSelectedBlocks: currentMaterialsData.currentSelectedBlocks,
      },
    });
  };

  onGetNBTClicked = () => {
    this.getNBT_base("CREATE_NBT_JOINED");
  };

  onGetNBTSplitClicked = () => {
    this.getNBT_base("CREATE_NBT_SPLIT");
  };

  onGetMapdatSplitClicked = () => {
    this.getNBT_base("CREATE_MAPDAT_SPLIT");
  };

  componentDidUpdate(prevProps) {
    const { optionValue_modeNBTOrMapdat, mapPreviewWorker_inProgress } = this.props;
    if (prevProps.optionValue_modeNBTOrMapdat !== optionValue_modeNBTOrMapdat) {
      // reset callback if changing mode from NBT to mapdat while rendering after download button clicked (very niche but a bug squashed nontheless)
      this.setState({ mapPreviewWorker_onFinishCallback: null });
    }
    if (!mapPreviewWorker_inProgress && this.state.mapPreviewWorker_onFinishCallback !== null) {
      this.state.mapPreviewWorker_onFinishCallback();
      this.setState({ mapPreviewWorker_onFinishCallback: null });
    }
  }

  componentWillUnmount() {
    this.nbtWorker.terminate();
  }

  render() {
    const { buttonWidth_NBT_Joined, buttonWidth_NBT_Split, buttonWidth_Mapdat_Split } = this.state;
    const {
      getLocaleString,
      supportedVersions,
      optionValue_version,
      onOptionChange_version,
      optionValue_mapSize_x,
      onOptionChange_mapSize_x,
      optionValue_mapSize_y,
      onOptionChange_mapSize_y,
      optionValue_modeNBTOrMapdat,
      onOptionChange_modeNBTOrMapdat,
      optionValue_cropImage,
      onOptionChange_cropImage,
      optionValue_showGridOverlay,
      onOptionChange_showGridOverlay,
      optionValue_staircasing,
      onOptionChange_staircasing,
      optionValue_whereSupportBlocks,
      onOptionChange_WhereSupportBlocks,
      optionValue_supportBlock,
      setOption_SupportBlock,
      optionValue_unobtainable,
      onOptionChange_unobtainable,
      optionValue_transparency,
      onOptionChange_transparency,
      optionValue_transparencyTolerance,
      onOptionChange_transparencyTolerance,
      optionValue_betterColour,
      onOptionChange_BetterColour,
      optionValue_dithering,
      onOptionChange_dithering,
      optionValue_preprocessingEnabled,
      onOptionChange_PreProcessingEnabled,
      preProcessingValue_brightness,
      onOptionChange_PreProcessingBrightness,
      preProcessingValue_contrast,
      onOptionChange_PreProcessingContrast,
      preProcessingValue_saturation,
      onOptionChange_PreProcessingSaturation,
      preProcessingValue_backgroundColourSelect,
      onOptionChange_PreProcessingBackgroundColourSelect,
      preProcessingValue_backgroundColour,
      onOptionChange_PreProcessingBackgroundColour,
      onViewOnlineClicked,
    } = this.props;
    return (
      <div className="section settingsDiv">
        <h2>{getLocaleString("MAP-SETTINGS/TITLE")}</h2>
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/MODE-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/MODE")}
            {":"}
          </b>
        </Tooltip>{" "}
        <select onChange={onOptionChange_modeNBTOrMapdat} value={optionValue_modeNBTOrMapdat}>
          <option value="NBT">Schematic (NBT)</option>
          <option value="Mapdat">Datafile (map.dat)</option>
        </select>
        <br />
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/VERSION-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/VERSION")}
            {":"}
          </b>
        </Tooltip>{" "}
        <select value={optionValue_version} onChange={onOptionChange_version}>
          {supportedVersions.map((supportedVersion) => (
            <option key={supportedVersion.MCVersion}>{supportedVersion.MCVersion}</option>
          ))}
        </select>
        <br />
        <b>
          {getLocaleString("MAP-SETTINGS/MAP-SIZE")}
          {": "}
        </b>
        <input className="mapSizeInput" type="number" min="1" step="1" value={optionValue_mapSize_x} onChange={onOptionChange_mapSize_x} />
        x
        <input className="mapSizeInput" type="number" min="1" step="1" value={optionValue_mapSize_y} onChange={onOptionChange_mapSize_y} />
        <br />
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/CROP-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/CROP")}
            {":"}
          </b>
        </Tooltip>{" "}
        <input type="checkbox" checked={optionValue_cropImage} onChange={onOptionChange_cropImage} />
        <br />
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/GRID-OVERLAY-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/GRID-OVERLAY")}
            {":"}
          </b>
        </Tooltip>{" "}
        <input type="checkbox" checked={optionValue_showGridOverlay} onChange={onOptionChange_showGridOverlay} />
        <br />
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/3D/TITLE-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/3D/TITLE")}
            {":"}
          </b>
        </Tooltip>{" "}
        <select onChange={onOptionChange_staircasing} value={optionValue_staircasing}>
          <option value="off">{getLocaleString("MAP-SETTINGS/3D/OFF")}</option>
          <option value="classic">{getLocaleString("MAP-SETTINGS/3D/CLASSIC")}</option>
          <option value="optimized">{getLocaleString("MAP-SETTINGS/3D/VALLEY")}</option>
        </select>
        <br />
        {optionValue_modeNBTOrMapdat === "NBT" ? (
          <span>
            <b>
              {getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/WHERE-SUPPORT-BLOCKS/TITLE")}
              {": "}
            </b>
            <select value={optionValue_whereSupportBlocks} onChange={onOptionChange_WhereSupportBlocks}>
              <option value="None">{getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/WHERE-SUPPORT-BLOCKS/NONE")}</option>
              <option value="Important">{getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/WHERE-SUPPORT-BLOCKS/IMPORTANT")}</option>
              <option value="AllOptimized">{getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/WHERE-SUPPORT-BLOCKS/ALL-OPTIMIZED")}</option>
              <option value="AllDoubleOptimized">{getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/WHERE-SUPPORT-BLOCKS/ALL-DOUBLE-OPTIMIZED")}</option>
            </select>
            <br />
            <b>
              {getLocaleString("MAP-SETTINGS/NBT-SPECIFIC/SUPPORT-BLOCK-TO-ADD")}
              {": "}
            </b>
            <AutoCompleteInputBlockToAdd value={optionValue_supportBlock} setValue={setOption_SupportBlock} optionValue_version={optionValue_version} />
            <br />
          </span>
        ) : (
          <span>
            <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/MAPDAT-SPECIFIC/UNOBTAINABLE-COLOURS-TT")}>
              <b>
                {getLocaleString("MAP-SETTINGS/MAPDAT-SPECIFIC/UNOBTAINABLE-COLOURS")}
                {":"}
              </b>
            </Tooltip>{" "}
            <input type="checkbox" checked={optionValue_unobtainable} onChange={onOptionChange_unobtainable} />
            <br />
            <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/MAPDAT-SPECIFIC/TRANSPARENCY-TT")}>
              <b>
                {getLocaleString("MAP-SETTINGS/MAPDAT-SPECIFIC/TRANSPARENCY")}
                {":"}
              </b>
            </Tooltip>{" "}
            <input type="checkbox" checked={optionValue_transparency} onChange={onOptionChange_transparency} />
            <br />
            <b>
              {getLocaleString("MAP-SETTINGS/MAPDAT-SPECIFIC/TRANSPARENCY-TOLERANCE")}
              {": "}
            </b>
            <input
              type="range"
              min="0"
              max="256"
              value={optionValue_transparencyTolerance}
              onChange={onOptionChange_transparencyTolerance}
              disabled={!optionValue_transparency}
            />
            <input
              className="preProcessingInputBox"
              type="number"
              min="0"
              max="256"
              step="1"
              value={optionValue_transparencyTolerance}
              onChange={onOptionChange_transparencyTolerance}
              disabled={!optionValue_transparency}
            />
            <br />
          </span>
        )}
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/BETTER-COLOUR-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/BETTER-COLOUR")}
            {":"}
          </b>
        </Tooltip>{" "}
        <input type="checkbox" checked={optionValue_betterColour} onChange={onOptionChange_BetterColour} />
        <br />
        <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/DITHERING/TITLE-TT")}>
          <b>
            {getLocaleString("MAP-SETTINGS/DITHERING/TITLE")}
            {":"}
          </b>
        </Tooltip>{" "}
        <select value={optionValue_dithering} onChange={onOptionChange_dithering}>
          {Object.keys(DitherMethods).map((ditherMethodKey) => (
            <option key={DitherMethods[ditherMethodKey]["uniqueId"]} value={DitherMethods[ditherMethodKey]["uniqueId"]}>
              {"localeKey" in DitherMethods[ditherMethodKey]
                ? getLocaleString(DitherMethods[ditherMethodKey]["localeKey"])
                : DitherMethods[ditherMethodKey]["name"]}
            </option>
          ))}
        </select>
        <br />
        <details>
          <summary>{getLocaleString("MAP-SETTINGS/PREPROCESSING/TITLE")}</summary>
          <b>
            {getLocaleString("MAP-SETTINGS/PREPROCESSING/ENABLE")}
            {": "}
          </b>
          <input type="checkbox" checked={optionValue_preprocessingEnabled} onChange={onOptionChange_PreProcessingEnabled} />
          <br />
          <table>
            <tbody>
              <tr>
                <th>
                  <b>
                    {getLocaleString("MAP-SETTINGS/PREPROCESSING/BRIGHTNESS")}
                    {": "}
                  </b>
                </th>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={preProcessingValue_brightness}
                    onChange={onOptionChange_PreProcessingBrightness}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
                <td>
                  <input
                    className="preProcessingInputBox"
                    type="number"
                    min="0"
                    step="1"
                    value={preProcessingValue_brightness}
                    onChange={onOptionChange_PreProcessingBrightness}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <b>
                    {getLocaleString("MAP-SETTINGS/PREPROCESSING/CONTRAST")}
                    {": "}
                  </b>
                </th>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={preProcessingValue_contrast}
                    onChange={onOptionChange_PreProcessingContrast}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
                <td>
                  <input
                    className="preProcessingInputBox"
                    type="number"
                    min="0"
                    step="1"
                    value={preProcessingValue_contrast}
                    onChange={onOptionChange_PreProcessingContrast}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <b>
                    {getLocaleString("MAP-SETTINGS/PREPROCESSING/SATURATION")}
                    {": "}
                  </b>
                </th>
                <td>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={preProcessingValue_saturation}
                    onChange={onOptionChange_PreProcessingSaturation}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
                <td>
                  <input
                    className="preProcessingInputBox"
                    type="number"
                    min="0"
                    step="1"
                    value={preProcessingValue_saturation}
                    onChange={onOptionChange_PreProcessingSaturation}
                    disabled={!optionValue_preprocessingEnabled}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <Tooltip tooltipText={getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND/TITLE-TT")}>
                    <b>
                      {getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND/TITLE")}
                      {":"}
                    </b>
                  </Tooltip>{" "}
                </th>
                <td>
                  <select
                    onChange={onOptionChange_PreProcessingBackgroundColourSelect}
                    value={preProcessingValue_backgroundColourSelect}
                    disabled={!optionValue_preprocessingEnabled}
                  >
                    <option value="Off">{getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND/OFF")}</option>
                    <option value="On">{getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND/DITHERED")}</option>
                    <option value="On_Flat">{getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND/FLAT")}</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th>
                  <b>
                    {getLocaleString("MAP-SETTINGS/PREPROCESSING/BACKGROUND-COLOUR")}
                    {": "}
                  </b>
                </th>
                <td>
                  <input
                    type="color"
                    value={preProcessingValue_backgroundColour}
                    onChange={onOptionChange_PreProcessingBackgroundColour}
                    disabled={!optionValue_preprocessingEnabled || preProcessingValue_backgroundColourSelect === "Off"}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </details>
        <br />
        {optionValue_modeNBTOrMapdat === "NBT" ? (
          <span>
            <Tooltip tooltipText={getLocaleString("VIEW-ONLINE/TITLE-TT")}>
              <span className="greenButton_old" onClick={onViewOnlineClicked}>
                {getLocaleString("VIEW-ONLINE/TITLE")}
              </span>
            </Tooltip>
            <br />
            <Tooltip tooltipText={getLocaleString("DOWNLOAD/NBT-SPECIFIC/DOWNLOAD-TT")}>
              <div className="greenButton greenButton_large" style={{ display: "block" }} onClick={this.onGetNBTClicked}>
                <span className="greenButton_text greenButton_large_text">{getLocaleString("DOWNLOAD/NBT-SPECIFIC/DOWNLOAD")}</span>
                <div
                  className="greenButton_progressDiv"
                  style={{
                    width: `${Math.floor(buttonWidth_NBT_Joined * 100)}%`,
                  }}
                />
              </div>
            </Tooltip>
            <br />
            <Tooltip tooltipText={getLocaleString("DOWNLOAD/NBT-SPECIFIC/DOWNLOAD-SPLIT-TT")}>
              <div className="greenButton" style={{ display: "block" }} onClick={this.onGetNBTSplitClicked}>
                <span className="greenButton_text">{getLocaleString("DOWNLOAD/NBT-SPECIFIC/DOWNLOAD-SPLIT")}</span>
                <div
                  className="greenButton_progressDiv"
                  style={{
                    width: `${Math.floor(buttonWidth_NBT_Split * 100)}%`,
                  }}
                />
              </div>
            </Tooltip>
          </span>
        ) : (
          <span>
            <Tooltip tooltipText={getLocaleString("DOWNLOAD/MAPDAT-SPECIFIC/DOWNLOAD-TT")}>
              <div className="greenButton greenButton_large" style={{ display: "block" }} onClick={this.onGetMapdatSplitClicked}>
                <span className="greenButton_text greenButton_large_text">{getLocaleString("DOWNLOAD/MAPDAT-SPECIFIC/DOWNLOAD")}</span>
                <div
                  className="greenButton_progressDiv"
                  style={{
                    width: `${Math.floor(buttonWidth_Mapdat_Split * 100)}%`,
                  }}
                />
              </div>
            </Tooltip>
          </span>
        )}
        <br />
        <Tooltip tooltipText={getLocaleString("DONATE/TITLE-TT")}>
          <a className="donateA" href="./supporters">
            <span className="greenButton_old">{getLocaleString("DONATE/TITLE")}</span>
            <br />
          </a>
        </Tooltip>
      </div>
    );
  }
}

export default MapSettings;
