import { StyleSheet } from 'react-native'

const backgroundColor = '#181c27'

export const styles = StyleSheet.create({
  containerLoading: {
    zIndex: -1,
    display: 'none',
    height: 0,
    width: 0,
  },
  container: {
    backgroundColor,
    flex: 1,
  },
  devBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#3761F9',
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 5,
  },
  devButtonText: {
    fontSize: 10,
    lineHeight: 10,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  errorIcon: {
    width: 65,
    height: 65,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  errorText: {
    color: '#ffff00',
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  body: {
    fontSize: 16,
    color: '#fff',
  },
  flexrow: {
    flexDirection: 'row',
  },
  flexcol: {
    flexDirection: 'column',
  },
  flextwo: {
    flex: 2,
  },
  flexthree: {
    flex: 3,
  },
  flexone: {
    flex: 1,
  },
  fullHeight: {
    height: '100%',
  },
  centerContents: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  innerErrorContainer: {
    maxWidth: 245,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: '#3761F9',
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  // Utitlity Classes
  'mt-md': {
    marginTop: 16,
  },
  'mb-md': {
    marginBottom: 16,
  },
  textCenter: {
    textAlign: 'center',
  },
  // For modals
  modalView: {
    color: 'white',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    margin: 20,
    backgroundColor,
    borderRadius: 20,
    padding: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalHeader: {
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
})
