import ExpoModulesCore
import AdServices

public class ExpoAppleAdsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppleAds")

    AsyncFunction("getAttributionToken") { () -> String? in
      if #available(iOS 14.3, *) {
        do {
          let token = try AAAttribution.attributionToken()
          return token
        } catch {
          print("[ExpoAppleAds] Error getting attribution token: \(error)")
          return nil
        }
      } else {
        print("[ExpoAppleAds] AdServices requires iOS 14.3+")
        return nil
      }
    }
  }
}
