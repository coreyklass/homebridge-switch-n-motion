import {ServiceHelper} from './service-helper';
import {API, Characteristic, CharacteristicValue, Logger, PlatformAccessory, Service} from 'homebridge';
import EventEmitter from 'events';
import {WithUUID} from 'hap-nodejs/dist/types';
import {HBTimer} from '../hb-utils/hb-timer';
import {PlatformPlugin} from 'homebridge/lib/api';

export class OnOffServiceHelper extends ServiceHelper {


  /**
   * The On/Off characteristic to use
   * @private
   */
  private readonly _onOffCharacteristic: WithUUID<{ new (): Characteristic }>;



  /**
   * Shortcut to the On characteristic
   * @private
   */
  get onOffCharacteristic(): WithUUID<{ new (): Characteristic }> {
    return this._onOffCharacteristic;
  }



  /**
   * Returns the On state of the switch
   */
  get onState(): boolean {
    return (this.service.getCharacteristic(this.onOffCharacteristic).value as boolean);
  }


  /**
   * Sets the On state of the switch
   * @param value
   */
  set onState(value: boolean) {
    this.service.getCharacteristic(this.onOffCharacteristic).updateValue(value as CharacteristicValue);

    this.didSetOnState(value);
  }


  /**
   * Auto-Off Timer duration
   */
  autoOffTimerMS: number | null = null;



  /**
   * Auto-off timer
   * @private
   */
  private _autoOffTimer = new HBTimer();

  get autoOffTimer(): HBTimer {
    return this._autoOffTimer;
  }



  /**
   * Stores state change handlers
   * @private
   */
  private _stateChangeHandlers: ((value: boolean) => void)[] = [];




  /**
   * Constructor
   * @param api
   * @param log
   * @param accessory
   * @param serviceIdentifier
   * @param serviceType
   */
  constructor(api: API,
              log: Logger,
              accessory: PlatformAccessory,
              serviceIdentifier: string,
              serviceType: Service | typeof Service
  ) {
    super(api, log, accessory, serviceIdentifier, serviceType);

    let onOffCharacteristic: WithUUID<{ new (): Characteristic }> | null = null;

    // which characteristic are we using?
    if (serviceType === api.hap.Service.Switch) {
      onOffCharacteristic = api.hap.Characteristic.On;

    } else if (serviceType === api.hap.Service.OccupancySensor) {
      onOffCharacteristic = api.hap.Characteristic.OccupancyDetected;
    }

    // if there's no on/off characteristic, throw an error
    if (!onOffCharacteristic) {
      throw new Error('Unknown service type set: ' + serviceType);
    }

    this._onOffCharacteristic = onOffCharacteristic;

    this.service.getCharacteristic(onOffCharacteristic)
        .onSet(this.didSetCharacteristicValue.bind(this))
        .onGet(this.didRequestCharacteristicValue.bind(this));
  }



  /**
   * Registers a state change handler
   * @param handler
   */
  registerStateChangeHandler(handler: ((value: boolean) => void)) {
    this._stateChangeHandlers.push(handler);
  }




  /**
   * Turns off everything but the current helper
   * @param switchHelpers
   */
  turnOffEverythingButMe(switchHelpers: OnOffServiceHelper[]) {
    // if this service helper isn't on, turn it on
    if (!this.onState) {
      this.onState = true;
    }

    // loop through the other service helpers
    switchHelpers.forEach((indexServiceHelper: OnOffServiceHelper) => {
      // if the other service helper is ON, but NOT the current service helper, turn it OFF
      if ((indexServiceHelper !== this) && indexServiceHelper.onState) {
        indexServiceHelper.onState = false;
      }
    });
  }





  /**
   * On state was requested
   * @private
   */
  private didRequestCharacteristicValue(): boolean {
    return this.onState;
  }



  /**
   * If the characteristic value was changed
   * @private
   */
  private didSetCharacteristicValue(onStateValue: CharacteristicValue) {
    this.log.debug('didSetCharacteristicValue() : ' + this.serviceDisplayName + ' : StateSet = ' + String(onStateValue) + ' : CurrentState = ' + String(this.onState));

    // if the switch was turned on, reset the auto-off timer
    if (onStateValue) {
      this.resetAutoOffTimer();

    } else {
      this.autoOffTimer.clearTimer();
    }

    // loop over the state change handlers and process them
    this._stateChangeHandlers.forEach((indexHandler: (value: boolean) => void) => {
      indexHandler(onStateValue as boolean);
    });
  }



  /**
   * If the local value was set
   * @param onStateValue
   * @private
   */
  private didSetOnState(onStateValue: boolean) {
    this.log.debug('didSetOnState() : ' + this.serviceDisplayName + ' : StateSet = ' + String(onStateValue) + ' : CurrentState = ' + String(this.onState));

    // if the switch was turned on, reset the auto-off timer
    if (onStateValue) {
      this.resetAutoOffTimer();

    } else {
      this.autoOffTimer.clearTimer();
    }

    // loop over the state change handlers and process them
    this._stateChangeHandlers.forEach((indexHandler: (value: boolean) => void) => {
      indexHandler(onStateValue as boolean);
    });
  }







  /**
   * Resets the auto-off timer
   */
  resetAutoOffTimer() {
    // if there's an auto-off timer
    if (this.autoOffTimerMS !== null) {
      // reset the timer with an auto-off timer
      this.autoOffTimer.resetTimer(() => {
        if (this.onState) {
          this.onState = false;
        }
      }, this.autoOffTimerMS);
    }
  }




}
