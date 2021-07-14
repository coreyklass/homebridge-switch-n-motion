import {API, PlatformAccessory, Service} from 'homebridge';

export class ServiceHelper {

  service: Service;

  private readonly _api: API;

  private timerTimeout: any = null;


  get api(): API {
    return this._api;
  }


  /**
   * Returns the service display name
   */
  get serviceDisplayName(): string {
    return (this.service.getCharacteristic(this.api.hap.Characteristic.Name).value as string);
  }


  /**
   * Sets the service display name
   * @param name
   */
  set serviceDisplayName(name: string) {
    this.service.setCharacteristic(this.api.hap.Characteristic.Name, (name || 'UNKNOWN'));
  }




  constructor(api: API,
              private accessory: PlatformAccessory,
              private serviceIdentifier: string,
              private serviceType: Service | typeof Service
              ) {

    this._api = api;

    // init the Service
    this.service = accessory.getService(serviceIdentifier) ||
        accessory.addService(serviceType, serviceIdentifier, serviceIdentifier);
  }


  /**
   * Sets all services in the array except one
   * @param serviceHelpers
   * @param exceptionTester
   * @param exceptionSetter
   * @param defaultSetter
   */
  static setAllServicesExceptOne(serviceHelpers: ServiceHelper[],
                                 exceptionTester: (index: number, serviceHelper?: ServiceHelper) => boolean,
                                 exceptionSetter: (serviceHelper: ServiceHelper) => void,
                                 defaultSetter: (serviceHelper: ServiceHelper) => void
  ) {

    // look for the exception
    for (let helperIndex = 0; helperIndex < serviceHelpers.length; helperIndex++) {
      // pull the helper
      const indexHelper = serviceHelpers[helperIndex];

      // check for the exception
      const exceptionFlag = exceptionTester(helperIndex, indexHelper);

      // if this is the exception
      if (exceptionFlag) {
        exceptionSetter(indexHelper);
      }
    }

    // loop over the non-exception service helpers
    for (let helperIndex = 0; helperIndex < serviceHelpers.length; helperIndex++) {
      // pull the helper
      const indexHelper = serviceHelpers[helperIndex];

      // check for the exception
      const exceptionFlag = exceptionTester(helperIndex, indexHelper);

      // if this is not the exception
      if (!exceptionFlag) {
        defaultSetter(indexHelper);
      }
    }

  }


  /**
   * Resets the timer
   * @param handler
   * @param timerMS
   */
  resetTimer(handler: (() => void), timerMS: number) {
    this.clearTimer();

    this.timerTimeout = setTimeout(() => {
      handler();
    }, timerMS);
  }


  /**
   * Clears the timer
   */
  clearTimer() {
    if (this.timerTimeout) {
      clearTimeout(this.timerTimeout);
    }
  }






}
