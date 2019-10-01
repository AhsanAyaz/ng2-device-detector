/**
 * Created by ahsanayaz on 08/11/2016.
 */
import { PLATFORM_ID, Inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as Constants from './device-detector.constants';
import { ReTree } from './retree';

export interface DeviceInfo {
    userAgent: string;
    os: string;
    browser: string;
    device: string;
    os_version: string;
    browser_version: string;
}

@Injectable()
export class DeviceDetectorService {
    ua = '';
    userAgent = '';
    os = '';
    browser = '';
    device = '';
    os_version = '';
    browser_version = '';
    reTree = new ReTree();

    constructor(@Inject(PLATFORM_ID) private platformId) {
        if (isPlatformBrowser(this.platformId)) {
            this.ua = window.navigator.userAgent;
        }
        this._setDeviceInfo();
    }

    /**
     * @author Ahsan Ayaz
     * @desc Sets the initial value of the device when the service is initiated.
     * This value is later accessible for usage
     */
    private _setDeviceInfo() {
        let ua = this.ua;
        this.userAgent = ua;
        let mappings = [
            { const : 'OS' , prop: 'os'},
            { const : 'BROWSERS' , prop: 'browser'},
            { const : 'DEVICES' , prop: 'device'},
            { const : 'OS_VERSIONS' , prop: 'os_version'},
        ];

        mappings.forEach((mapping) => {
            this[mapping.prop] = Object.keys(Constants[mapping.const]).reduce((obj: any, item: any) => {
                obj[Constants[mapping.const][item]] = this.reTree.test(ua, Constants[`${mapping.const}_RE`][item]);
                return obj;
            }, {});
        });

        mappings.forEach((mapping) => {
            this[mapping.prop] = Object.keys(Constants[mapping.const])
            .map((key) => {
                return Constants[mapping.const][key];
            }).reduce((previousValue, currentValue) => {
              if (mapping.prop === 'device' && previousValue === Constants[mapping.const].ANDROID) {
                // if we have the actual device found, instead of 'Android', return the actual device
                return (this[mapping.prop][currentValue])
                  ? currentValue : previousValue;
              } else {
                return (previousValue === Constants[mapping.const].UNKNOWN && this[mapping.prop][currentValue])
                  ? currentValue : previousValue;
              }
            }, Constants[mapping.const].UNKNOWN);
        });

        this.browser_version = '0';
        if (this.browser !== Constants.BROWSERS.UNKNOWN) {
            let re = Constants.BROWSER_VERSIONS_RE[this.browser];
            let res = this.reTree.exec(ua, re);
            if (!!res) {
                this.browser_version = res[1];
            }
        }
    }

    /**
     * @author Ahsan Ayaz
     * @desc Returns the device information
     * @returns the device information object.
     */
    public getDeviceInfo(): DeviceInfo {
        const deviceInfo: DeviceInfo = {
            userAgent: this.userAgent,
            os : this.os,
            browser: this.browser,
            device : this.device,
            os_version: this.os_version,
            browser_version: this.browser_version
        };
        return deviceInfo;
    }

    /**
     * @author Ahsan Ayaz
     * @desc Compares the current device info with the mobile devices to check
     * if the current device is a mobile and also check current device is tablet so it will return false.
     * @returns whether the current device is a mobile
     */
    public isMobile(): boolean {
      if (this.isTablet()) {
        return false;
      }
      const match = Object.keys(Constants.MOBILES_RE).find((mobile) => {
        return this.reTree.test(this.userAgent, Constants.MOBILES_RE[mobile]);
      });
      return !!match;
    };

    /**
     * @author Ahsan Ayaz
     * @desc Compares the current device info with the tablet devices to check
     * if the current device is a tablet.
     * @returns whether the current device is a tablet
     */
    public isTablet() {
        // User agent same of ipad os13 and mac so this condition is checked, device is touchable or not
        // because there's no official touch screen for Mac
        if (!!this.reTree.test(this.userAgent, Constants.TABLETS_RE['iPad']) && 'ontouchend' in document) {
            return true;
        }
        const match = Object.keys(Constants.TABLETS_RE).find((mobile) => {
          return !!this.reTree.test(this.userAgent, Constants.TABLETS_RE[mobile]);
        });
        return !!match;
    };

    /**
     * @author Ahsan Ayaz
     * @desc Compares the current device info with the desktop devices to check
     * if the current device is a desktop device.
     * @returns whether the current device is a desktop device
     */
    public isDesktop() {
        const desktopDevices = [
            Constants.DEVICES.PS4,
            Constants.DEVICES.CHROME_BOOK,
            Constants.DEVICES.UNKNOWN
        ];
        if (this.device === Constants.DEVICES.UNKNOWN) {
            if (this.isMobile() || this.isTablet()) {
                return false;
            }
        }
        return desktopDevices.indexOf(this.device) > -1;
    };
}
