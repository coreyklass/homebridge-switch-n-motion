
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


  private readonly userSceneSwitches: SwitchServiceHelper[];
  private readonly userSceneOccupancySensors: OccupancySensorServiceHelper[];

  private readonly statelessSwitchAutoOffTimerMS = 2000;


  private readonly offOccupancySensorServiceHelpers: OccupancySensorServiceHelper[];
  private readonly nightLightSwitchServiceHelper: SwitchServiceHelper;
  private readonly controlSwitchServiceHelper: SwitchServiceHelper;

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
    switchListenerServiceHelper.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;



    // configure the motion sensor listener switch
    const motionListenerServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
        ServiceCodes.MotionListenerSwitch,
        ServiceCodes.MotionListenerSwitch
    );

    motionListenerServiceHelper.serviceDisplayName = config.motionListenerName;
    motionListenerServiceHelper.autoOffTimerMS = this.statelessSwitchAutoOffTimerMS;






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

    sceneNightLightOccupancySensorServiceHelper.serviceDisplayName = config.sceneNightLightMotionSensorName;


    const offOccupancySensorServiceHelpers = [
      sceneOffOccupancySensorServiceHelper,
      sceneNightLightOccupancySensorServiceHelper
    ];



    // loop over the scene configs and put in some user ones
    const sceneConfigs = (config.sceneModeSwitches || []);

    this.userSceneSwitches = [];
    this.userSceneOccupancySensors = [];


    for (let sceneIndex = 0; sceneIndex < sceneConfigs.length; sceneIndex++) {
      const indexConfig = sceneConfigs[sceneIndex];

      // configure a scene motion sensor service
      const userOccupancySensorKey = this.buildKeyForSceneIndex(sceneIndex) + '-' + ServiceCodes.UserSceneOccupancySensor;

      const userSceneOccupancySensorServiceHelper = this.serviceHelperCollection.newOccupancySensorServiceHelper(
          userOccupancySensorKey,
          userOccupancySensorKey
      );

      userSceneOccupancySensorServiceHelper.serviceDisplayName = indexConfig.switchInstanceName;

      this.userSceneOccupancySensors.push(userSceneOccupancySensorServiceHelper);



      // configure a scene switch
      const userSwitchKey = this.buildUserSceneSwitchKeyForIndex(sceneIndex);

      const userSceneSwitchServiceHelper = this.serviceHelperCollection.newSwitchServiceHelper(
          userSwitchKey,
          userSwitchKey
      );

      userSceneSwitchServiceHelper.serviceDisplayName = indexConfig.switchInstanceName;

      this.userSceneSwitches.push(userSceneSwitchServiceHelper);


      // when the user scene switch is turned on or off, call the handler
      userSceneSwitchServiceHelper.onStateUpdateEvent.on('On', (value: boolean) => {
        this.writeLog('User scene switch State Update Event Fired: ' + String(sceneIndex) + ' ' + value);

        if (value) {
          this.didTurnOnUserSceneSwitch(sceneIndex);

        } else {
          this.didTurnOffUserSceneSwitch(sceneIndex);

          // if there are no user switches turned on, turn the default on
          if (!this.userSceneSwitchServiceHelperTurnedOn()) {
            this.userDefaultSceneSwitchServiceHelper().onState = true;
          }
        }

        this.reconcileOccupancySensors();
      });
    }



    // %%%%%%%%%%%%%%%%%
    // set up some logic
    // %%%%%%%%%%%%%%%%%


    // when the night light switch is flipped
    nightLightSwitchServiceHelper.onStateUpdateEvent.on('On', (value: boolean) => {
      // reconcile the occupancy sensors
      this.reconcileOccupancySensors();
    });




    // switch and motion listeners for turning on the control switch
    const turnOnControlSwitchHandler = ((value: boolean) => {
      if (value) {
        if (!controlSwitchServiceHelper.onState) {
          controlSwitchServiceHelper.onState = true;

          // reconcile the occupancy sensors
          this.reconcileOccupancySensors();
        }
      }
    });

    switchListenerServiceHelper.onStateUpdateEvent.on('On', turnOnControlSwitchHandler);

    motionListenerServiceHelper.onStateUpdateEvent.on('On', turnOnControlSwitchHandler);


    // listen for control switch actions
    controlSwitchServiceHelper.onStateUpdateEvent.on('On', (value: boolean) => {
      // if the switch was turned on
      if (value) {
        this.executeTurnOn();

      // if the switch was turned off
      } else {
        this.executeTurnOff();
      }
    });


    // if there are no user switches turned on, turn the default on
    if (!this.userSceneSwitchServiceHelperTurnedOn()) {
      this.userDefaultSceneSwitchServiceHelper().onState = true;
    }



    this.nightLightSwitchServiceHelper = nightLightSwitchServiceHelper;
    this.controlSwitchServiceHelper = controlSwitchServiceHelper;
    this.offOccupancySensorServiceHelpers = offOccupancySensorServiceHelpers;


    setTimeout(() => {
      this.reconcileOccupancySensors();
    });

  }


  /**
   * Returns the default scene switch
   */
  userDefaultSceneSwitchServiceHelper(): SwitchServiceHelper {
    return this.userSceneSwitches[0];
  }



  /**
   * Returns the scene default occupancy sensor
   */
  userDefaultSceneOccupancySensorServiceHelper(): OccupancySensorServiceHelper {
    return this.userSceneOccupancySensors[0];
  }



  /**
   * Returns the user scene switch service helper index that's turned on
   */
  userSceneSwitchServiceHelperIndexTurnedOn(): number | null {
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
  userSceneSwitchServiceHelperTurnedOn(): SwitchServiceHelper | null {
    const index = this.userSceneSwitchServiceHelperIndexTurnedOn();
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
  buildUserSceneOccupancySensorKeyForIndex(index: number): string {
    return this.buildKeyForSceneIndex(index) + '-' + ServiceCodes.UserSceneOccupancySensor;
  }


  /**
   * Turns on one exclusive user scene switch
   * @param index
   */
  turnOnOneExclusiveUserSceneSwitch(index: number) {
    SwitchServiceHelper.turnOnOneExclusiveSwitch(this.userSceneSwitches, index);
  }


  /**
   * Turns on one exclusive user scene occpancy sensor
   * @param index
   */
  turnOnOneExclusiveUserSceneOccupancySensor(index: number) {
    OccupancySensorServiceHelper.turnOnOneExclusiveOccupancySensor(this.userSceneOccupancySensors, index);
  }





  /**
   * A User Scene Switch was turned on
   * @param index
   */
  didTurnOnUserSceneSwitch(index: number) {
    this.writeLog('User Scene Switch ' + String(index) + ' turned On');

    // turn off the other user scene switches
    this.turnOnOneExclusiveUserSceneSwitch(index);

    // turn on the corresponding occupancy sensor
    this.turnOnOneExclusiveUserSceneOccupancySensor(index);
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


  /**
   * Reconciles the occupancy sensors
   */
  reconcileOccupancySensors() {
    if (this.controlSwitchServiceHelper) {
      if (this.controlSwitchServiceHelper.onState) {
        this.executeTurnOn();

      } else {
        this.executeTurnOff();
      }
    }
  }


  /**
   * Execute the turn on actions
   */
  executeTurnOn() {
    // turn off the "off" sensors
    this.offOccupancySensorServiceHelpers.forEach((indexHelper: OccupancySensorServiceHelper) => {
      if (indexHelper.occupancyState) {
        indexHelper.occupancyState = false;
      }
    });

    // turn on the selected sensor
    const turnedOnHelperIndex = this.userSceneSwitchServiceHelperIndexTurnedOn();

    if (turnedOnHelperIndex !== null) {
      OccupancySensorServiceHelper.turnOnOneExclusiveOccupancySensor(
          this.userSceneOccupancySensors,
          turnedOnHelperIndex
      );
    }  }



  /**
   * Execute the turn off actions
   */
  executeTurnOff() {
    // turn off all of the user scene sensors
    this.userSceneOccupancySensors.forEach((indexHelper: OccupancySensorServiceHelper) => {
      if (indexHelper.occupancyState) {
        indexHelper.occupancyState = false;
      }
    });

    // turn on an "off" sensor
    const turnOnHelperIndex = (this.nightLightSwitchServiceHelper.onState ? 1 : 0);

    OccupancySensorServiceHelper.turnOnOneExclusiveOccupancySensor(
        this.offOccupancySensorServiceHelpers,
        turnOnHelperIndex
    );
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



