import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MediaDeviceAdapter {
    async getAudioStream(): Promise<MediaStream> {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    async getVideoStream(): Promise<MediaStream> {
        return await navigator.mediaDevices.getUserMedia({ video: true });
    }
}
