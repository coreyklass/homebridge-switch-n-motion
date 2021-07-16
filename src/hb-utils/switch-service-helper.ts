import {ServiceHelper} from './service-helper';
import {API, Characteristic, CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import EventEmitter from 'events';
import {WithUUID} from 'hap-nodejs/dist/types';

export class SwitchServiceHelper extends ServiceHelper {



  /**
   * Shortcut to the On characteristic
   * @private
   */
  private get onCharacteristic(): WithUUID<{ new (): Characteristic }> {
    return this.api.hap.Characteristic.On;
  }



  /**
   * Returns the On state of the switch
   */
  get onState(): boolean {
    return (this.service.getCharacteristic(this.onCharacteristic).value as boolean);
  }


  /**
   * Sets the On state of the switch
   * @param value
   */
  set onState(value: boolean) {
    this.service.getCharacteristic(this.onCharacteristic).updateValue(value as CharacteristicValue);

    this.didChangeOnState(value);
  }


  /**
   * Auto-Off Timer
   */
  autoOffTimerMS: number | null = null;




  /**
   * Event Emitter for when the state changes
   */
  onStateUpdateEvent = new EventEmitter();


  /**
   * Constructor
   * @param api
   * @param accessory
   * @param serviceIdentifier
   */
  constructor(api: API,
              accessory: PlatformAccessory,
              serviceIdentifier: string
  ) {
    super(api, accessory, serviceIdentifier, api.hap.Service.Switch);

    this.service.getCharacteristic(this.onCharacteristic)
        .onSet(this.didChangeOnState.bind(this))
        .onGet(this.didRequestOnState.bind(this));
  }



  /**
   * Turns on one exclusive switch
   * @param switchHelpers
   * @param exceptionIndex
   */
  static turnOnOneExclusiveSwitch(switchHelpers: SwitchServiceHelper[], exceptionIndex: number) {
    const exceptionTester = ((index: number): boolean => {
      return (index === exceptionIndex);
    });

    const exceptionSetter = ((helper: ServiceHelper) => {
      const switchHelper = (helper as SwitchServiceHelper);

      if (!switchHelper.onState) {
        switchHelper.onState = true;
      }
    });

    const defaultSetter = ((helper: ServiceHelper) => {
      const switchHelper = (helper as SwitchServiceHelper);

      if (switchHelper.onState) {
        switchHelper.onState = false;
      }
    });

    ServiceHelper.setAllServicesExceptOne(
        switchHelpers,
        exceptionTester,
        exceptionSetter,
        defaultSetter
    );
  }






  /**
   * On state was requested
   * @private
   */
  private didRequestOnState(): boolean {
    return this.onState;
  }



  /**
   * If the On state changed
   * @private
   */
  private didChangeOnState(value: CharacteristicValue) {
    // if the switch was turned on, reset the auto-off timer
    if (value) {
      this.resetSwitchAutoOffTimer();

    } else {
      this.clearTimer();
    }

    setTimeout(() => {
      this.onStateUpdateEvent.emit('On', value);
    });
  }



  /**
   * Resets the auto-off timer
   */
  resetSwitchAutoOffTimer() {
    if (this.autoOffTimerMS !== null) {
      this.resetTimer(() => {
        if (this.onState) {
          this.onState = false;
        }
      }, this.autoOffTimerMS);
    }
  }




}
