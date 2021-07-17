import {API, Logger, PlatformAccessory, Service} from 'homebridge';

export class ServiceHelper {

  service: Service;

  private readonly _api: API;



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
              protected log: Logger,
              private accessory: PlatformAccessory,
              private serviceIdentifier: string,
              private serviceType: Service | typeof Service
              ) {

    this._api = api;

    // init the Service
    this.service = accessory.getService(serviceIdentifier) ||
        accessory.addService(serviceType, serviceIdentifier, serviceIdentifier);
  }





}
