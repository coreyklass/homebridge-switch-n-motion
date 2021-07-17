import {SwitchInstanceModeConfig} from './switch-instance-mode-config';
import {SceneControlSwitchInstanceConfig} from './scene-control-switch.instance-config';


export interface SwitchNMonitorInstanceConfig {
  accessoryUniqueID: number;
  switchInstanceName: string;

  switchListenerTriggerSwitchName: string;
  motionListenerTriggerSwitch: string;

  masterControlSwitchName: string;
  controlSwitchAutoOffTimerMS: number;
  motionListenerIgnoreSwitchName: string;
  motionListenerIgnoreSwitchTimerMS: number;

  nightLightControlSwitchName: string;
  nightLightTriggerSwitchName: string;

  changeSceneTriggerSwitchName: string;

  sceneOffMotionSensorName: string;
  sceneNightLightMotionSensorName: string;

  sceneModeSwitches: SceneControlSwitchInstanceConfig[];

  modeConfigs: SwitchInstanceModeConfig[];

}

