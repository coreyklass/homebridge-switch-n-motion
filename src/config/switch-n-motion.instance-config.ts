import {SwitchInstanceModeConfig} from './switch-instance-mode-config';
import {SceneControlSwitchInstanceConfig} from './scene-control-switch.instance-config';


export interface SwitchNMonitorInstanceConfig {
  accessoryUniqueID: number;
  switchInstanceName: string;

  switchListenerName: string;
  motionListenerName: string;

  controlSwitchAutoOffTimerMS: number;
  controlSwitchName: string;

  nightLightSwitchName: string;

  sceneOffMotionSensorName: string;
  sceneNightMotionSensorName: string;

  sceneModeSwitches: SceneControlSwitchInstanceConfig[];

  modeConfigs: SwitchInstanceModeConfig[];

}

