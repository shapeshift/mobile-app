Pod::Spec.new do |s|
  s.name           = 'ExpoAppleAds'
  s.version        = '1.0.0'
  s.summary        = 'Apple Search Ads attribution for Expo'
  s.description    = 'Provides access to Apple\'s AdServices API for attribution tokens'
  s.author         = 'ShapeShift'
  s.homepage       = 'https://shapeshift.com'
  s.platforms      = { :ios => '14.3' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.swift'
  s.frameworks = 'AdServices'
end
