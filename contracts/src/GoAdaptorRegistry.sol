// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.24;

import { Ownable2StepUpgradeable } from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { GoErrors, AdaptorInfo } from "./shared/GoTypes.sol";
import { IVenueAdaptor } from "./adaptors/IVenueAdaptor.sol";

contract GoAdaptorRegistry is Initializable, Ownable2StepUpgradeable {
    mapping(address => AdaptorInfo) private _adaptors;
    mapping(string => address) private _venueAdaptors;
    address[] private _adaptorList;

    event AdaptorRegistered(address indexed adaptor, string venueId, string version);
    event AdaptorDeprecated(address indexed adaptor);
    event AdaptorReactivated(address indexed adaptor);

    function initialize() external initializer {
        __Ownable_init(msg.sender);
    }

    function registerAdaptor(address adaptor, string calldata venueId, string calldata version) external onlyOwner {
        if (adaptor == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        if (_adaptors[adaptor].active) {
            revert GoErrors.AlreadyInitialized();
        }
        if (bytes(venueId).length == 0 || bytes(version).length == 0) {
            revert GoErrors.EmptyString();
        }

        bool isNewRegistration = _adaptors[adaptor].registeredAt == 0;

        IVenueAdaptor venueAdaptor = IVenueAdaptor(adaptor);
        string memory declaredVenueId = venueAdaptor.venueId();
        if (keccak256(bytes(declaredVenueId)) != keccak256(bytes(venueId))) {
            revert GoErrors.VenueIdMismatch();
        }

        _adaptors[adaptor] = AdaptorInfo({
            venueId: venueId,
            version: version,
            active: true,
            registeredAt: block.timestamp
        });
        _venueAdaptors[venueId] = adaptor;
        if (isNewRegistration) {
            _adaptorList.push(adaptor);
        }

        emit AdaptorRegistered(adaptor, venueId, version);
    }

    function deprecateAdaptor(address adaptor) external onlyOwner {
        if (!_adaptors[adaptor].active) {
            revert GoErrors.AdaptorNotRegistered(adaptor);
        }
        string memory venueId = _adaptors[adaptor].venueId;
        _adaptors[adaptor].active = false;
        delete _venueAdaptors[venueId];
        emit AdaptorDeprecated(adaptor);
    }

    function reactivateAdaptor(address adaptor) external onlyOwner {
        if (adaptor == address(0)) {
            revert GoErrors.InvalidAddress();
        }
        if (_adaptors[adaptor].registeredAt == 0) {
            revert GoErrors.AdaptorNotRegistered(adaptor);
        }
        _adaptors[adaptor].active = true;
        emit AdaptorReactivated(adaptor);
    }

    function isRegistered(address adaptor) external view returns (bool) {
        return _adaptors[adaptor].active;
    }

    function getAdaptor(string calldata venueId) external view returns (address) {
        return _venueAdaptors[venueId];
    }

    function getAdaptorInfo(address adaptor) external view returns (AdaptorInfo memory) {
        return _adaptors[adaptor];
    }

    function getAdaptorCount() external view returns (uint256) {
        return _adaptorList.length;
    }

    function getAdaptorAt(uint256 index) external view returns (address) {
        if (index >= _adaptorList.length) {
            revert GoErrors.IndexOutOfBounds();
        }
        return _adaptorList[index];
    }

    uint256[47] private __gap;
}
