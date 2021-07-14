
import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';
import {SwitchNMotionPlatform} from './switch-n-motion.platform';
import {SwitchNMonitorInstanceConfig} from './config/switch-n-motion.instance-config';
import {SwitchNMotionServiceStates} from './switch-n-motion-service-states';
import {AccessoryContext} from './config/accessory-context';
import {SceneControlSwitchInstanceConfig} from './config/scene-control-switch.instance-config';
import {ServiceHelperCollection} from './hb-utils/service-helper-collection';
import {SwitchServiceHelper} from './hb-utils/switch-service-helper';
import {OccupancySensorServiceHelper} from './hb-utils/occupancy-sensor-service-helper';


export class SwitchNMotionAccessory {

  private readonly serviceStates: SwitchNMotionServiceStates;


  private readonly serviceHelperCollection: ServiceHelperCollection;



  private switchListenerSwitchTimeout: any;
  private motionListenerSwitchTimeout: any;
  private controlSwitchTimeout: any;



  /**
   *
   * @private
   */
  private readonly Chars = {
    On: this.platform.Characteristic.On,
    OccupancyDetected: this.platform.Characteristic.OccupancyDetected,
    Name: this.platform.Characteristic.Name
  };



  /**
   * Control Switch Auto-Off Timer Config
   */
  get controlSwitchAutoOffTimerMS(): number {
    return this.config.controlSwitchAutoOffTimerMS;
  }




  constructor(
    private readonly platform: SwitchNMotionPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly config: SwitchNMonitorInstanceConfig
    ) {

    // pull the saved context
    const accessoryContext = (accessory.context as AccessoryContext);


    // pull the existing service states if they exist
    const existingServiceStates = (accessoryContext ? accessoryContext.serviceStates : null);


    // figure out the service states here
    this.serviceStates = {
      controlSwitchOffAtTime: (existingServiceStates ? existingServiceStates.controlSwitchOffAtTime : null)
    };

    accessoryContext.serviceStates = this.serviceStates;





    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');





    // init the service helper collection
    this.serviceHelperCollection = new ServiceHelperCollection(platform, platform.api, accessory);



    // configure the switch listener switch
    const switchListenerServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
        ServiceCodes.SwitchListenerSwitch,
        ServiceCodes.SwitchListenerSwitch
    );

    switchListenerServiceHelper.serviceDisplayName = config.switchListenerName;



    // configure the motion sensor listener switch
    const motionListenerServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
        ServiceCodes.MotionListenerSwitch,
        ServiceCodes.MotionListenerSwitch
    );

    motionListenerServiceHelper.serviceDisplayName = config.motionListenerName;




    // configure the control switch
    const controlSwitchServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
        ServiceCodes.ControlSwitch,
        ServiceCodes.ControlSwitch
    );

    controlSwitchServiceHelper.serviceDisplayName = config.controlSwitchName;


    // configure the night light switch
    const nightLightSwitchServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
        ServiceCodes.NightLightSwitch,
        ServiceCodes.NightLightSwitch
    );

    nightLightSwitchServiceHelper.serviceDisplayName = config.nightLightSwitchName;



    // configure the scene off motion sensor service
    const sceneOffOccupancySensorServiceHelper = this.serviceHelperCollection.newOccupancySensorServiceHelper(
        ServiceCodes.OffSceneOccupancySensor,
        ServiceCodes.OffSceneOccupancySensor
    );

    sceneOffOccupancySensorServiceHelper.serviceDisplayName = config.sceneOffMotionSensorName;


    // configure the scene night light motion sensor service
    const sceneNightLightOccupancySensorServiceHelper = this.serviceHelperCollection.newOccupancySensorServiceHelper(
        ServiceCodes.NightLightSceneOccupancySensor,
        ServiceCodes.NightLightSceneOccupancySensor
    );

    sceneNightLightOccupancySensorServiceHelper.serviceDisplayName = config.sceneNightMotionSensorName;


    // loop over the scene configs and put in some user ones
    const sceneConfigs = ([] as SceneControlSwitchInstanceConfig[]);

    sceneConfigs.push({
      sceneModeID: 99999,
      switchInstanceName: 'Default Scene'
    });



    (config.sceneModeSwitches || []).forEach((indexConfig) => {
      sceneConfigs.push(indexConfig);
    });


    for (let sceneIndex = 0; sceneIndex < sceneConfigs.length; sceneIndex++) {
      const indexConfig = sceneConfigs[sceneIndex];


      // configure a scene motion sensor service
      const userOccupancySensorKey = this.buildKeyForSceneIndex(sceneIndex) + '-' + ServiceCodes.UserSceneOccupancySensor;

      const userSceneOccupancySensorServiceHelper = this.serviceHelperCollection.newOccupancySensorServiceHelper(
          userOccupancySensorKey,
          userOccupancySensorKey
      );

      userSceneOccupancySensorServiceHelper.serviceDisplayName = indexConfig.switchInstanceName;


      // configure a scene switch
      const userSwitchKey = this.buildUserSceneSwitchKeyForIndex(sceneIndex);

      const userSceneSwitchServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
          userSwitchKey,
          userSwitchKey
      );

      userSceneSwitchServiceHelper.serviceDisplayName = indexConfig.switchInstanceName;

      // when the user scene switch is turned on, call the handler
      userSceneSwitchServiceHelper.onStateUpdateEvent.on('On', (value: boolean) => {
        this.writeLog('User scene switch State Update Event Fired: ' + String(sceneIndex) + ' ' + value);

        if (value) {
          this.didTurnOnUserSceneSwitch(sceneIndex);
        } else {
          this.didTurnOffUserSceneSwitch(sceneIndex);
        }
      });
    }





  }




  // writes a log entry
  writeLog(text: string) {
    this.platform.log.debug(text);
  }


  /**
   * Builds a key for a scene index
   * @param index
   */
  buildKeyForSceneIndex(index: number): string {
    return 'custom-scene-' + String(index);
  }



  /**
   * Builds a key for a user scene switch
   * @param index
   */
  buildUserSceneSwitchKeyForIndex(index: number): string {
    return this.buildKeyForSceneIndex(index) + '-' + ServiceCodes.UserSceneSwitch;
  }


  /**
   * Builds a key for a user scene occupancy sensor
   * @param index
   */
  buildUserSceneOccupancySensorKeyForIndex(index: number): string {
    return this.buildKeyForSceneIndex(index) + '-' + ServiceCodes.UserSceneOccupancySensor;
  }






  /**
   * A User Scene Switch was turned on
   * @param index
   */
  didTurnOnUserSceneSwitch(index: number) {
    this.writeLog('User Scene Switch ' + String(index) + ' turned On');

    // turn on the corresponding occupancy sensor
    const occupancySensorKey = this.buildUserSceneOccupancySensorKeyForIndex(index);
    const occupancyServiceHelper = (this.serviceHelperCollection.serviceHelperForKey(occupancySensorKey) as OccupancySensorServiceHelper);

    if (occupancyServiceHelper && !occupancyServiceHelper.occupancyState) {
      occupancyServiceHelper.occupancyState = true;
    }


    // turn off the other user scene switches
    const sceneConfigs = (this.config.sceneModeSwitches || []) as SceneControlSwitchInstanceConfig[];

    for (let sceneIndex = 0; sceneIndex < sceneConfigs.length; sceneIndex++) {
      if (sceneIndex !== index) {
        const switchKey = this.buildUserSceneSwitchKeyForIndex(sceneIndex);

        const serviceHelper = (this.serviceHelperCollection.serviceHelperForKey(switchKey) as SwitchServiceHelper);

        if (serviceHelper && serviceHelper.onState) {
          serviceHelper.onState = false;
        }
      }

    }

  }


  /**
   * A user scene switch was turned off
   * @param index
   */
  didTurnOffUserSceneSwitch(index: number) {
    this.writeLog('User Scene Switch ' + String(index) + ' turned Off');

    // turn off the related occupancy sensor
    const key = this.buildUserSceneOccupancySensorKeyForIndex(index);
    const serviceHelper = (this.serviceHelperCollection.serviceHelperForKey(key) as OccupancySensorServiceHelper);

    if (serviceHelper) {
      this.writeLog('User Scene Occupancy Sensor ' + String(index) + ' turned Off');
      serviceHelper.occupancyState = false;
    }
     
  }


}




enum ServiceCodes {
  SwitchListenerSwitch = 'switch-listener-switch',
  MotionListenerSwitch = 'motion-listener-switch',
  ControlSwitch = 'control-switch',
  NightLightSwitch = 'night-light-switch',
  UserSceneSwitch = 'user-scene-switch',

  OffSceneOccupancySensor = 'off-scene-occupancy-sensor',
  NightLightSceneOccupancySensor = 'night-light-scene-occupancy-sensor',
  UserSceneOccupancySensor = 'user-scene-occupancy-sensor'
}



