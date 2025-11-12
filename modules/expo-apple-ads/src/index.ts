import { requireNativeModule } from 'expo-modules-core';

const ExpoAppleAdsModule = requireNativeModule('ExpoAppleAds');

export interface CampaignData {
  attribution: boolean;
  orgId?: number;
  campaignId?: number;
  conversionType?: string;
  adGroupId?: number;
  countryOrRegion?: string;
  keywordId?: number;
  creativeSetId?: number;
  [key: string]: any;
}

export async function getAttributionToken(): Promise<string | null> {
  try {
    const token = await ExpoAppleAdsModule.getAttributionToken();
    return token;
  } catch (error) {
    console.error('Error getting attribution token:', error);
    return null;
  }
}

export async function getCampaignData(): Promise<CampaignData | null> {
  try {
    const data = await ExpoAppleAdsModule.getCampaignData();
    return data;
  } catch (error) {
    console.error('Error getting campaign data:', error);
    return null;
  }
}
