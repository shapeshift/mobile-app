package expo.modules.seedvault

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Base64
import com.solanamobile.seedvault.WalletContractV1
import com.solanamobile.seedvault.Wallet
import com.solanamobile.seedvault.PublicKeyResponse
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSeedVault : Module() {
  private var requestPublicKeyPromise: Promise? = null
  private val REQUEST_PUBLIC_KEY = 1001

  override fun definition() = ModuleDefinition {
    Name("ExpoSeedVault")

    AsyncFunction("requestPublicKey") { authToken: String, derivationPath: String, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      requestPublicKeyPromise = promise

      try {
        val derivationUri = Uri.parse(derivationPath)
        val intent = Wallet.requestPublicKey(
          activity,
          authToken.toLong(),
          derivationUri
        )

        activity.startActivityForResult(intent, REQUEST_PUBLIC_KEY)
      } catch (e: Exception) {
        promise.reject("E_REQUEST_PUBLIC_KEY", "Failed to request public key: ${e.message}", e)
        requestPublicKeyPromise = null
      }
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      if (requestCode == REQUEST_PUBLIC_KEY) {
        val promise = requestPublicKeyPromise ?: return@OnActivityResult
        requestPublicKeyPromise = null

        if (resultCode == Activity.RESULT_OK && data != null) {
          try {
            @Suppress("DEPRECATION")
            val publicKeyResponses = data.getParcelableArrayListExtra<PublicKeyResponse>(
              WalletContractV1.EXTRA_PUBLIC_KEY
            )

            if (publicKeyResponses != null && publicKeyResponses.isNotEmpty()) {
              val publicKeyResponse = publicKeyResponses[0]
              val publicKeyBytes = publicKeyResponse.publicKey

              if (publicKeyBytes != null) {
                val base64PublicKey = Base64.encodeToString(publicKeyBytes, Base64.NO_WRAP)
                promise.resolve(
                  mapOf("publicKey" to base64PublicKey)
                )
              } else {
                promise.reject("E_NO_PUBLIC_KEY", "Public key is null - account may not exist for this derivation path", null)
              }
            } else {
              promise.reject("E_NO_PUBLIC_KEY", "No public key responses returned from Seed Vault", null)
            }
          } catch (e: Exception) {
            promise.reject("E_PARSE_ERROR", "Failed to parse public key: ${e.message}", e)
          }
        } else {
          val authToken = data?.getLongExtra(WalletContractV1.EXTRA_AUTH_TOKEN, 0L)
          promise.reject(
            "E_USER_CANCELLED",
            "User cancelled public key request or invalid result. Auth token: $authToken",
            null
          )
        }
      }
    }
  }
}
