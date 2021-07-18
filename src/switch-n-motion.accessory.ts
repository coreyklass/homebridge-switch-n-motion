
import {PlatformAccessory} from 'homebridge';
import {SwitchNMotionPlatform} from './switch-n-motion.platform';
import {SwitchNMonitorInstanceConfig} from './config/switch-n-motion.instance-config';
import {SwitchNMotionServiceStates} from './switch-n-motion-service-states';
import {AccessoryContext} from './config/accessory-context';
import {ServiceHelperCollection} from './hb-service-helpers/service-helper-collection';
import {OnOffServiceHelper} from './hb-service-helpers/on-off-service-helper';


export class SwitchNMotionAccessory {

  private readonly serviceStates: SwitchNMotionServiceStates;


  private readonly serviceHelperCollection: ServiceHelperCollection;


  private readonly userSceneSwitches: OnOffServiceHelper[];
  private readonly userSceneSensors: OnOffServiceHelper[];

  private readonly statelessSwitchAutoOffTimerMS = 500;


  private readonly offStateSensors: OnOffServiceHelper[];
  private readonly nightLightControlSwitch: OnOffServiceHelper;
  private readonly masterControlSwitch: OnOffServiceHelper;



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
    this.serviceHelperCollection = new ServiceHelperCollection(platform, platform.api, platform.log, accessory);



    // configure the switch trigger switch
    const switchListenerTriggerSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.SwitchTriggerSwitch,
        ServiceCodes.SwitchTriggerSwitch,
        platform.api.hap.Service.Switch
    );

    switchListenerTriggerSwitch.serviceDisplayName = config.switchListenerTriggerSwitchName;
    switchListenerTriggerSwitch.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;



    // configure the motion sensor trigger switch
    const motionListenerTriggerSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.MotionTriggerSwitch,
        ServiceCodes.MotionTriggerSwitch,
        platform.api.hap.Service.Switch
    );

    motionListenerTriggerSwitch.serviceDisplayName = config.motionListenerTriggerSwitch;
    motionListenerTriggerSwitch.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;





    // configure the motion sensor listener ignore switch
    const motionListenerIgnoreSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.MotionListenerIgnoreSwitch,
        ServiceCodes.MotionListenerIgnoreSwitch,
        platform.api.hap.Service.Switch
    );

    motionListenerIgnoreSwitch.serviceDisplayName = config.motionListenerIgnoreSwitchName;



    // configure the motion sensor listener ignore timer switch
    const motionListenerIgnoreTimerSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.MotionListenerIgnoreTimerSwitch,
        ServiceCodes.MotionListenerIgnoreTimerSwitch,
        platform.api.hap.Service.Switch
    );

    motionListenerIgnoreTimerSwitch.serviceDisplayName = config.motionListenerIgnoreSwitchName + ' Timer';
    motionListenerIgnoreTimerSwitch.autoOffTimerMS = config.motionListenerIgnoreSwitchTimerMS;







    // configure the master control switch
    const masterControlSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.MasterControlSwitch,
        ServiceCodes.MasterControlSwitch,
        platform.api.hap.Service.Switch
    );

    masterControlSwitch.serviceDisplayName = config.masterControlSwitchName;




    // configure the night light switch
    const nightLightControlSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.NightLightControlSwitch,
        ServiceCodes.NightLightControlSwitch,
        platform.api.hap.Service.Switch
    );

    nightLightControlSwitch.serviceDisplayName = config.nightLightControlSwitchName;




    // configure the night light trigger switch
    const nightLightTriggerSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.NightLightControlTriggerSwitch,
        ServiceCodes.NightLightControlTriggerSwitch,
        platform.api.hap.Service.Switch
    );

    nightLightTriggerSwitch.serviceDisplayName = config.nightLightTriggerSwitchName;
    nightLightTriggerSwitch.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;





    // configure the change scene listener switch
    const changeSceneTriggerSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.ChangeSceneTriggerSwitch,
        ServiceCodes.ChangeSceneTriggerSwitch,
        platform.api.hap.Service.Switch
    );

    changeSceneTriggerSwitch.serviceDisplayName = config.changeSceneTriggerSwitchName;
    changeSceneTriggerSwitch.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;






    // configure the scene off motion sensor service
    const sceneOffMotionSensor = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.OffSceneSensor,
        ServiceCodes.OffSceneSensor,
        platform.api.hap.Service.OccupancySensor
    );

    sceneOffMotionSensor.serviceDisplayName = config.sceneOffMotionSensorName;



    // configure the scene night light motion sensor service
    const sceneNightLightMotionSensor = this.serviceHelperCollection.newOnOffServiceHelper(
        ServiceCodes.NightLightSceneSensor,
        ServiceCodes.NightLightSceneSensor,
        platform.api.hap.Service.OccupancySensor
    );

    sceneNightLightMotionSensor.serviceDisplayName = config.sceneNightLightMotionSensorName;


    const offStateSensors = [
      sceneOffMotionSensor,
      sceneNightLightMotionSensor
    ];



    // loop over the scene configs and put in some user ones
    const sceneConfigs = (config.sceneModeSwitches || []);

    this.userSceneSwitches = [];
    this.userSceneSensors = [];

    for (let sceneIndex = 0; sceneIndex < sceneConfigs.length; sceneIndex++) {
      const indexConfig = sceneConfigs[sceneIndex];

      // configure a scene motion sensor service
      const userSceneMotionSensorKey = this.buildKeyForSceneIndex(sceneIndex) + '-' + ServiceCodes.UserSceneSensor;

      const userSceneMotionSensor = this.serviceHelperCollection.newOnOffServiceHelper(
          userSceneMotionSensorKey,
          userSceneMotionSensorKey,
          platform.api.hap.Service.OccupancySensor
      );

      userSceneMotionSensor.serviceDisplayName = indexConfig.switchInstanceName;

      this.userSceneSensors.push(userSceneMotionSensor);



      // configure a scene switch
      const userSceneSwitchKey = this.buildUserSceneSwitchKeyForIndex(sceneIndex) + '-' + ServiceCodes.UserSceneSwitch;

      const userSceneSwitch = this.serviceHelperCollection.newOnOffServiceHelper(
          userSceneSwitchKey,
          userSceneSwitchKey,
          platform.api.hap.Service.Switch
      );

      userSceneSwitch.serviceDisplayName = indexConfig.switchInstanceName;

      this.userSceneSwitches.push(userSceneSwitch);



      // when the user scene switch is turned on or off, call the handler
      userSceneSwitch.registerStateChangeHandler((value: boolean) => {
        // if the user scene switch was turned on
        if (value) {
          this.didTurnOnUserSceneSwitch(sceneIndex);

        // if the user scene switch was turned off
        } else {
          this.didTurnOffUserSceneSwitch(sceneIndex);

          // if there are no user switches turned on, turn the default on
          if (!this.userSceneSwitchTurnedOn()) {
            this.defaultUserSceneSwitch().onState = true;
          }
        }

        this.reconcileUserSceneSensors();
      });
    }



    // %%%%%%%%%%%%%%%%%
    // set up some logic
    // %%%%%%%%%%%%%%%%%





    // switch trigger flips the master control switch state
    switchListenerTriggerSwitch.registerStateChangeHandler((value: boolean) => {
      if (value) {
        // flip the control switch state
        masterControlSwitch.onState = !masterControlSwitch.onState;

        // reconcile the occupancy sensors
        this.reconcileUserSceneSensors();
      }
    });



    // motion trigger flips the master control switch state
    motionListenerTriggerSwitch.registerStateChangeHandler((value: boolean) => {
      // if occupancy turned on
      if (value) {
        const ignoreMotionFlag =
            motionListenerIgnoreSwitch.onState ||
            motionListenerIgnoreTimerSwitch.onState;

        // if the master control switch is not on and the motion listener ignore switch is not on
        //   eg. we're ignoring the motion sensor for X time
        if (!masterControlSwitch.onState && !ignoreMotionFlag) {
          masterControlSwitch.onState = true;

          // reconcile the occupancy sensors
          this.reconcileUserSceneSensors();
        }
      }
    });





    // when the night light trigger switch is flipped
    nightLightTriggerSwitch.registerStateChangeHandler((value: boolean) => {
      if (value) {
        // flip the night light switch
        nightLightControlSwitch.onState = !nightLightControlSwitch.onState;
      }
    });





    // when the current scene trigger switch is flipped
    changeSceneTriggerSwitch.registerStateChangeHandler((value: boolean) => {
      if (value) {
        this.didRequestCurrentSceneChange();
      }
    });





    // when the night light switch is flipped
    nightLightControlSwitch.registerStateChangeHandler((value: boolean) => {
      // reconcile the occupancy sensors
      this.reconcileUserSceneSensors();
    });





    // listen for control switch actions
    masterControlSwitch.registerStateChangeHandler((value: boolean) => {
      // if the switch was turned on
      if (value) {
        this.executeMasterControlOn();

      // if the switch was turned off
      } else {
        // turn on the motion listener ignore timer switch
        motionListenerIgnoreTimerSwitch.onState = true;

        // execute the turn off action
        this.executeMasterControlOff();
      }
    });




    // if there are no user switches turned on, turn the default on
    if (!this.userSceneSwitchTurnedOn()) {
      this.defaultUserSceneSwitch().onState = true;
    }




    this.nightLightControlSwitch = nightLightControlSwitch;
    this.masterControlSwitch = masterControlSwitch;
    this.offStateSensors = offStateSensors;


    this.reconcileUserSceneSensors();

  }



  /**
   * Returns the default scene switch
   */
  defaultUserSceneSwitch(): OnOffServiceHelper {
    return this.userSceneSwitches[0];
  }




  /**
   * Returns the scene default occupancy sensor
   */
  defaultUserSceneSensor(): OnOffServiceHelper {
    return this.userSceneSensors[0];
  }



  /**
   * Returns the user scene switch service helper index that's turned on
   */
  userSceneSwitchTurnedOnIndex(): number | null {
    let onIndex: number | null = null;

    for (let testIndex = 0; testIndex < this.userSceneSwitches.length; testIndex++) {
      if (this.userSceneSwitches[testIndex].onState) {
        onIndex = testIndex;
      }
    }

    return onIndex;
  }




  /**
   * Returns the user scene switch service helper that's turned on
   */
  userSceneSwitchTurnedOn(): OnOffServiceHelper | null {
    const index = this.userSceneSwitchTurnedOnIndex();
    return (index !== null ? this.userSceneSwitches[index] : null);
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
  buildUserSceneSensorKeyForIndex(index: number): string {
    return this.buildKeyForSceneIndex(index) + '-' + ServiceCodes.UserSceneSensor;
  }


  /**
   * Turns on one exclusive user scene switch
   * @param index
   */
  turnOnOneExclusiveUserSceneSwitch(index: number) {
    const userSceneSwitch = this.userSceneSwitches[index];

    if (userSceneSwitch) {
      userSceneSwitch.turnOffEverythingButMe(this.userSceneSwitches);
    }
  }


  /**
   * Turns on one exclusive user scene sensor
   * @param index
   */
  turnOnOneExclusiveUserSceneSensor(index: number) {
    const userSceneSensor = this.userSceneSensors[index];

    if (userSceneSensor) {
      userSceneSensor.turnOffEverythingButMe(this.userSceneSensors);
    }
  }



  /**
   * Change the current scene
   */
  didRequestCurrentSceneChange() {
    // which is the selected index?
    let currentIndex = this.userSceneSwitchTurnedOnIndex();

    // if there's no selected index, use the first one
    if (currentIndex === null) {
      currentIndex = 0;
    }

    // increment the index by 1
    let newIndex = currentIndex + 1;

    // if the new index is too large, reset it
    if (newIndex >= this.userSceneSwitches.length) {
      newIndex = 0;
    }

    // turns on the scene at the new index
    this.turnOnOneExclusiveUserSceneSwitch(newIndex);

    // if the control switch is off, turn it on
    if (!this.masterControlSwitch.onState) {
      this.masterControlSwitch.onState = true;
    }
  }




  /**
   * A User Scene Switch was turned on
   * @param index
   */
  didTurnOnUserSceneSwitch(index: number) {
    // turn off the other user scene switches
    this.turnOnOneExclusiveUserSceneSwitch(index);

    // turn on the corresponding occupancy sensor
    this.turnOnOneExclusiveUserSceneSensor(index);
  }




  /**
   * A user scene switch was turned off
   * @param index
   */
  didTurnOffUserSceneSwitch(index: number) {
    // turn off the related sensor
    const key = this.buildUserSceneSensorKeyForIndex(index);
    const sceneSensor = (this.serviceHelperCollection.serviceHelperForKey(key) as OnOffServiceHelper);

    if (sceneSensor) {
      sceneSensor.onState = false;
    }

    this.reconcileUserSceneSwitches();
  }


  /**
   * Reconciles the user scene switches
   */
  reconcileUserSceneSwitches() {
    // run in a separate thread but wait for the results
    setTimeout(() => {
      // pull the turned-on user scene switch
      const userSceneSwitch = this.userSceneSwitchTurnedOn();

      // if there's none, turn on the first one
      if (!userSceneSwitch) {
        this.turnOnOneExclusiveUserSceneSwitch(0);
      }
    });
  }





  /**
   * Reconciles the occupancy sensors
   */
  reconcileUserSceneSensors() {
    setTimeout(() => {
      if (this.masterControlSwitch.onState) {
        this.executeMasterControlOn();

      } else {
        this.executeMasterControlOff();
      }
    });
  }



  /**
   * Execute the turn on actions
   */
  executeMasterControlOn() {
    // turn on the selected sensor
    const userSceneSwitchTurnedOnIndex = this.userSceneSwitchTurnedOnIndex();

    if (userSceneSwitchTurnedOnIndex !== null) {
      const userSceneSensor = this.userSceneSensors[userSceneSwitchTurnedOnIndex];

      if (userSceneSensor) {
        userSceneSensor.turnOffEverythingButMe(this.userSceneSensors);
      }
    }

    // turn off the "off" sensors
    this.offStateSensors.forEach((indexSensor: OnOffServiceHelper) => {
      if (indexSensor.onState) {
        indexSensor.onState = false;
      }
    });
  }



  /**
   * Execute the turn off actions
   */
  executeMasterControlOff() {
    // turn on an "off" sensor
    const turnOnSwitchIndex = (this.nightLightControlSwitch.onState ? 1 : 0);
    const turnOnSensor = this.offStateSensors[turnOnSwitchIndex];

    if (turnOnSensor) {
      turnOnSensor.turnOffEverythingButMe(this.offStateSensors);
    }

    // turn off all of the user scene sensors
    this.userSceneSensors.forEach((indexSensor: OnOffServiceHelper) => {
      if (indexSensor.onState) {
        indexSensor.onState = false;
      }
    });
  }



}




enum ServiceCodes {
  SwitchTriggerSwitch = 'switch-listener-switch',
  MotionTriggerSwitch = 'motion-listener-switch',
  NightLightControlTriggerSwitch = 'night-light-listener-switch',
  ChangeSceneTriggerSwitch = 'change-scene-switch',

  MasterControlSwitch = 'control-switch',
  NightLightControlSwitch = 'night-light-switch',
  UserSceneSwitch = 'user-scene-switch',

  MotionListenerIgnoreSwitch = 'motion-listener-ignore-switch',
  MotionListenerIgnoreTimerSwitch = 'control-switch-off-ignore-motion-listener-switch',

  OffSceneSensor = 'off-scene-occupancy-sensor',
  NightLightSceneSensor = 'night-light-scene-occupancy-sensor',
  UserSceneSensor = 'user-scene-occupancy-sensor'
}



