import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import {SwitchNMotionAccessory} from './switch-n-motion.accessory';
import {SwitchNMonitorInstanceConfig} from './config/switch-n-motion.instance-config';


export class SwitchNMotionPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
      public readonly log: Logger,
      public readonly config: PlatformConfig,
      public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // when accessory states are restored
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');

      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }


  // called for cached accessories when restored from disk
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  // reads the settings and sets up accessories
  discoverDevices() {
    // pull the switch instances
    const config = ((this.config as unknown) as ISwitchNMotionConfig);

    // loop over the switch instances
    (config.accessoryInstances || []).forEach((indexInstanceConfig: SwitchNMonitorInstanceConfig) => {

      // generate a unique ID to identify the instance
      const uuid = this.api.hap.uuid.generate(String(indexInstanceConfig.accessoryUniqueID));

      // look for a registered accessory with this UUID
      const existingAccessory = this.accessories.find((testAccessory: PlatformAccessory) => {
        return (testAccessory.UUID === uuid);
      });

      // if the accessory is registered
      if (existingAccessory) {
        // log it
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // create an accessory handler for the device
        new SwitchNMotionAccessory(this, existingAccessory, indexInstanceConfig);

      } else {
        // create a new accessory
        this.log.info('Adding new accessory:', indexInstanceConfig.switchInstanceName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(indexInstanceConfig.switchInstanceName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context  .device = indexInstanceConfig;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new SwitchNMotionAccessory(this, accessory, indexInstanceConfig);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });
  }
}


interface ISwitchNMotionConfig {
  accessoryInstances: SwitchNMonitorInstanceConfig[];
}


