import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Device, MethodEligibility } from '../domain/eligibility';
import { useOverrides } from './overrides';

type Props = {
  visible: boolean;
  onClose: () => void;
  device: Device | null;
  eligibility: MethodEligibility[];
};

export function DevSheet({ visible, onClose, device, eligibility }: Props) {
  const { overrides, setOverrides } = useOverrides();

  return (
    <Modal visible={visible} onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Overrides</Text>
        <Text>{JSON.stringify(overrides)}</Text>

        <Text style={styles.label}>Platform</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            onPress={() => setOverrides({ ...overrides, platform: 'ios' })}
          >
            <Text>ios</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={() => setOverrides({ ...overrides, platform: 'android' })}
          >
            <Text>android</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Apple Pay card</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            onPress={() =>
              setOverrides({ ...overrides, hasApplePayCard: true })
            }
          >
            <Text>yes</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={() =>
              setOverrides({ ...overrides, hasApplePayCard: false })
            }
          >
            <Text>no</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Google Pay</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.btn}
            onPress={() => setOverrides({ ...overrides, hasGooglePay: true })}
          >
            <Text>yes</Text>
          </Pressable>
          <Pressable
            style={styles.btn}
            onPress={() => setOverrides({ ...overrides, hasGooglePay: false })}
          >
            <Text>no</Text>
          </Pressable>
        </View>

        <Pressable style={styles.btn} onPress={() => setOverrides({})}>
          <Text>clear overrides</Text>
        </Pressable>

        <Text style={styles.heading}>Device</Text>
        <Text>{device ? JSON.stringify(device) : 'probing...'}</Text>

        <Text style={styles.heading}>Eligibility</Text>
        {eligibility.map((e) => (
          <Text key={e.method}>
            {e.method} - {e.eligible ? 'ok' : e.reason}
          </Text>
        ))}

        <Pressable style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>close</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    fontWeight: 'bold',
    marginTop: 24,
  },
  label: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#eee',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  close: {
    marginTop: 24,
    padding: 14,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
  },
});
