package expo.modules

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Base64
import android.util.Log
import com.solanamobile.seedvault.WalletContractV1
import com.solanamobile.seedvault.Wallet
import com.solanamobile.seedvault.PublicKeyResponse
import com.solanamobile.seedvault.SigningResponse
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

class ExpoSeedVault : Module() {
  private val pendingPromises = ConcurrentHashMap<Int, Promise>()
  private val nextRequestId = AtomicInteger(0)

  // Each operation type gets its own request code range so OnActivityResult
  // can distinguish which kind of result it is handling.
  companion object {
    private const val AUTHORIZE_SEED_BASE = 1000
    private const val REQUEST_PUBLIC_KEY_BASE = 2000
    private const val SIGN_MESSAGE_BASE = 3000
    private const val RANGE_SIZE = 1000
  }

  private fun nextRequestCode(base: Int): Int {
    return base + (nextRequestId.getAndIncrement() % RANGE_SIZE)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoSeedVault")

    AsyncFunction("authorizeSeed") { purpose: Int, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      val requestCode = nextRequestCode(AUTHORIZE_SEED_BASE)

      try {
        Log.d("ExpoSeedVault", "Authorizing seed - purpose: $purpose, requestCode: $requestCode")
        pendingPromises[requestCode] = promise
        val intent = Wallet.authorizeSeed(activity, purpose)
        activity.startActivityForResult(intent, requestCode)
      } catch (e: Exception) {
        pendingPromises.remove(requestCode)
        promise.reject("E_AUTHORIZE_SEED", "Failed to authorize seed: ${e.message}", e)
      }
    }

    AsyncFunction("requestPublicKey") { authToken: String, derivationPath: String, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      val requestCode = nextRequestCode(REQUEST_PUBLIC_KEY_BASE)

      try {
        val derivationUri = Uri.parse(derivationPath)
        val authTokenLong = try {
          if (authToken.isEmpty()) 0L else authToken.toLong()
        } catch (e: NumberFormatException) {
          0L
        }

        Log.d("ExpoSeedVault", "Requesting public key - derivationPath: $derivationPath, authToken: $authTokenLong, requestCode: $requestCode")

        pendingPromises[requestCode] = promise
        val intent = Wallet.requestPublicKey(
          activity,
          authTokenLong,
          derivationUri
        )

        activity.startActivityForResult(intent, requestCode)
      } catch (e: Exception) {
        pendingPromises.remove(requestCode)
        promise.reject("E_REQUEST_PUBLIC_KEY", "Failed to request public key: ${e.message}", e)
      }
    }

    AsyncFunction("signMessage") { authToken: String, message: String, derivationPath: String, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      val requestCode = nextRequestCode(SIGN_MESSAGE_BASE)

      try {
        val authTokenLong = try {
          authToken.toLong()
        } catch (e: NumberFormatException) {
          promise.reject("E_INVALID_AUTH_TOKEN", "Invalid auth token format", e)
          return@AsyncFunction
        }

        val derivationUri = Uri.parse(derivationPath)
        val messageBytes = Base64.decode(message, Base64.NO_WRAP)

        Log.d("ExpoSeedVault", "Signing message - derivationPath: $derivationPath, authToken: $authTokenLong, messageSize: ${messageBytes.size}, requestCode: $requestCode")

        pendingPromises[requestCode] = promise
        val intent = Wallet.signMessage(
          activity,
          authTokenLong,
          derivationUri,
          messageBytes
        )

        activity.startActivityForResult(intent, requestCode)
      } catch (e: Exception) {
        pendingPromises.remove(requestCode)
        promise.reject("E_SIGN_MESSAGE", "Failed to sign message: ${e.message}", e)
      }
    }

    AsyncFunction("deauthorizeSeed") { authToken: String, promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity available", null)
        return@AsyncFunction
      }

      try {
        val authTokenLong = try {
          authToken.toLong()
        } catch (e: NumberFormatException) {
          promise.reject("E_INVALID_AUTH_TOKEN", "Invalid auth token format", e)
          return@AsyncFunction
        }

        Log.d("ExpoSeedVault", "Deauthorizing seed - authToken: $authTokenLong")
        Wallet.deauthorizeSeed(activity, authTokenLong)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("E_DEAUTHORIZE_SEED", "Failed to deauthorize seed: ${e.message}", e)
      }
    }

    AsyncFunction("getAuthorizedSeeds") { purpose: Int, promise: Promise ->
      val context = appContext.reactContext ?: run {
        promise.reject("E_NO_CONTEXT", "No context available", null)
        return@AsyncFunction
      }

      try {
        Log.d("ExpoSeedVault", "Getting authorized seeds - purpose: $purpose")

        val projection = arrayOf(
          WalletContractV1.AUTHORIZED_SEEDS_AUTH_TOKEN,
          WalletContractV1.AUTHORIZED_SEEDS_SEED_NAME,
          WalletContractV1.AUTHORIZED_SEEDS_AUTH_PURPOSE
        )

        val cursor = Wallet.getAuthorizedSeeds(
          context,
          projection,
          WalletContractV1.AUTHORIZED_SEEDS_AUTH_PURPOSE,
          purpose
        )

        val seedsList = mutableListOf<Map<String, Any?>>()

        cursor?.use {
          val authTokenIndex = it.getColumnIndex(WalletContractV1.AUTHORIZED_SEEDS_AUTH_TOKEN)
          val nameIndex = it.getColumnIndex(WalletContractV1.AUTHORIZED_SEEDS_SEED_NAME)
          val purposeIndex = it.getColumnIndex(WalletContractV1.AUTHORIZED_SEEDS_AUTH_PURPOSE)

          while (it.moveToNext()) {
            val authToken = it.getLong(authTokenIndex)
            val name = if (nameIndex >= 0) it.getString(nameIndex) else null
            val seedPurpose = it.getInt(purposeIndex)

            seedsList.add(
              mapOf(
                "authToken" to authToken.toString(),
                "name" to name,
                "purpose" to seedPurpose
              )
            )
          }
        }

        Log.d("ExpoSeedVault", "Found ${seedsList.size} authorized seeds")
        promise.resolve(seedsList)
      } catch (e: Exception) {
        Log.e("ExpoSeedVault", "Failed to get authorized seeds", e)
        promise.reject("E_GET_AUTHORIZED_SEEDS", "Failed to get authorized seeds: ${e.message}", e)
      }
    }

    OnActivityResult { _, (requestCode, resultCode, data) ->
      val promise = pendingPromises.remove(requestCode) ?: return@OnActivityResult

      when {
        requestCode in AUTHORIZE_SEED_BASE until AUTHORIZE_SEED_BASE + RANGE_SIZE -> {
          try {
            val authToken = Wallet.onAuthorizeSeedResult(resultCode, data)
            Log.d("ExpoSeedVault", "Seed authorized successfully - authToken: $authToken, requestCode: $requestCode")
            promise.resolve(authToken.toString())
          } catch (e: Exception) {
            Log.e("ExpoSeedVault", "Seed authorization failed", e)
            promise.reject("E_AUTHORIZE_FAILED", "Failed to authorize seed: ${e.message}", e)
          }
        }

        requestCode in REQUEST_PUBLIC_KEY_BASE until REQUEST_PUBLIC_KEY_BASE + RANGE_SIZE -> {
          Log.d("ExpoSeedVault", "Activity result - requestCode: $requestCode, resultCode: $resultCode (RESULT_OK=${Activity.RESULT_OK}, RESULT_CANCELED=${Activity.RESULT_CANCELED}), hasData: ${data != null}")

          if (resultCode == Activity.RESULT_OK && data != null) {
            try {
              val authToken = data.getLongExtra(WalletContractV1.EXTRA_AUTH_TOKEN, 0L)

              @Suppress("DEPRECATION")
              val publicKeyResponses = data.getParcelableArrayListExtra<PublicKeyResponse>(
                WalletContractV1.EXTRA_PUBLIC_KEY
              )

              if (publicKeyResponses != null && publicKeyResponses.isNotEmpty()) {
                Log.d("ExpoSeedVault", "Received ${publicKeyResponses.size} public key responses for requestCode: $requestCode")

                publicKeyResponses.forEachIndexed { index, response ->
                  val pubKeyBytes = response.publicKey
                  if (pubKeyBytes != null) {
                    val hexPubKey = pubKeyBytes.joinToString("") { "%02x".format(it) }
                    val base64PubKey = Base64.encodeToString(pubKeyBytes, Base64.NO_WRAP)
                    Log.d("ExpoSeedVault", "Response[$index] - PublicKey (hex): $hexPubKey")
                    Log.d("ExpoSeedVault", "Response[$index] - PublicKey (base64): $base64PubKey")
                  } else {
                    Log.d("ExpoSeedVault", "Response[$index] - PublicKey is null")
                  }
                }

                val publicKeyResponse = publicKeyResponses[0]
                val publicKeyBytes = publicKeyResponse.publicKey

                if (publicKeyBytes != null) {
                  val base64PublicKey = Base64.encodeToString(publicKeyBytes, Base64.NO_WRAP)
                  Log.d("ExpoSeedVault", "Returning public key from response[0] for requestCode: $requestCode")
                  promise.resolve(
                    mapOf(
                      "publicKey" to base64PublicKey,
                      "authToken" to if (authToken != 0L) authToken.toString() else null
                    )
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
            val errorMessage = data?.getStringExtra("error_message") ?: "No error message"
            Log.e("ExpoSeedVault", "Request failed - requestCode: $requestCode, resultCode: $resultCode, authToken: $authToken, errorMessage: $errorMessage, dataExtras: ${data?.extras}")
            promise.reject(
              "E_USER_CANCELLED",
              "User cancelled public key request or invalid result. ResultCode: $resultCode, Auth token: $authToken, Error: $errorMessage",
              null
            )
          }
        }

        requestCode in SIGN_MESSAGE_BASE until SIGN_MESSAGE_BASE + RANGE_SIZE -> {
          Log.d("ExpoSeedVault", "Sign message result - requestCode: $requestCode, resultCode: $resultCode, hasData: ${data != null}")

          if (resultCode == Activity.RESULT_OK && data != null) {
            try {
              val authToken = data.getLongExtra(WalletContractV1.EXTRA_AUTH_TOKEN, 0L)

              @Suppress("DEPRECATION")
              val signingResponses = data.getParcelableArrayListExtra<SigningResponse>(
                WalletContractV1.EXTRA_SIGNING_RESPONSE
              )

              if (signingResponses != null && signingResponses.isNotEmpty()) {
                val signingResponse = signingResponses[0]
                val signatures = signingResponse.signatures

                if (signatures != null && signatures.isNotEmpty()) {
                  val signatureBytes = signatures[0]
                  val base64Signature = Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
                  promise.resolve(
                    mapOf(
                      "signature" to base64Signature,
                      "authToken" to if (authToken != 0L) authToken.toString() else null
                    )
                  )
                } else {
                  promise.reject("E_NO_SIGNATURE", "No signatures in signing response", null)
                }
              } else {
                promise.reject("E_NO_SIGNATURE", "No signing responses returned from Seed Vault", null)
              }
            } catch (e: Exception) {
              promise.reject("E_PARSE_ERROR", "Failed to parse signature: ${e.message}", e)
            }
          } else {
            val errorMessage = data?.getStringExtra("error_message") ?: "No error message"
            Log.e("ExpoSeedVault", "Sign message failed - requestCode: $requestCode, resultCode: $resultCode, errorMessage: $errorMessage")
            promise.reject(
              "E_SIGN_FAILED",
              "Failed to sign message. ResultCode: $resultCode, Error: $errorMessage",
              null
            )
          }
        }
      }
    }
  }
}
